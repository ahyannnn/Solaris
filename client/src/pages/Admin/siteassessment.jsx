// pages/Admin/SiteAssessment.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaSpinner,
  FaFileInvoice,
  FaMoneyBillWave,
  FaQrcode,
  FaClock,
  FaExclamationTriangle,
  FaDownload,
  FaInfoCircle,
  FaFilter,
  FaChevronLeft,
  FaChevronRight,
  FaUser,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaBuilding,
  FaMicrochip,
  FaUserCog,
  FaEnvelope,
  FaPhone,
  FaRegFileAlt,
  FaClipboardList,
  FaFileAlt,
  FaEdit,
  FaUserCheck,
  FaTools,
  FaPlus,
  FaCheck,
  FaWifi
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/siteAssessment.css';

const SiteAssessment = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('free-quotes');
  const [freeQuotes, setFreeQuotes] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [showAssignEngineerModal, setShowAssignEngineerModal] = useState(false);
  const [showAssignDeviceModal, setShowAssignDeviceModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [verificationNote, setVerificationNote] = useState('');
  const [engineerId, setEngineerId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [siteVisitDate, setSiteVisitDate] = useState('');
  const [siteVisitNotes, setSiteVisitNotes] = useState('');
  const [quotationFile, setQuotationFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [engineers, setEngineers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [stats, setStats] = useState({
    freeQuotes: { total: 0, pending: 0, assigned: 0, processing: 0, completed: 0 },
    preAssessments: { total: 0, pendingReview: 0, pendingPayment: 0, forVerification: 0, paid: 0, scheduled: 0, completed: 0 }
  });

  useEffect(() => {
    fetchData();
    fetchEngineers();
    fetchDevices();
    fetchStats();
  }, [activeTab, filter, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      if (activeTab === 'free-quotes') {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: filter === 'all' ? undefined : filter, page: currentPage, limit: 10 }
        });
        setFreeQuotes(response.data.quotes || []);
        setTotalPages(response.data.totalPages || 1);
      } else {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: filter === 'all' ? undefined : filter, page: currentPage, limit: 10 }
        });
        setPreAssessments(response.data.assessments || []);
        setTotalPages(response.data.totalPages || 1);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error fetching data:', error);
      showToast('Failed to load data', 'error');
      setLoading(false);
    }
  };

  const fetchEngineers = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users?role=engineer`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setEngineers(response.data.users || []);
    } catch (error) {
      console.error('Error fetching engineers:', error);
    }
  };

  const fetchDevices = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/devices`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { status: 'available' }
      });
      setDevices(response.data.devices || []);
    } catch (error) {
      console.error('Error fetching devices:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const token = sessionStorage.getItem('token');

      const freeQuotesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const quotes = freeQuotesRes.data.quotes || [];

      const preAssessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assessments = preAssessmentsRes.data.assessments || [];

      setStats({
        freeQuotes: {
          total: quotes.length,
          pending: quotes.filter(q => q.status === 'pending').length,
          assigned: quotes.filter(q => q.status === 'assigned').length,
          processing: quotes.filter(q => q.status === 'processing').length,
          completed: quotes.filter(q => q.status === 'completed').length
        },
        preAssessments: {
          total: assessments.length,
          pendingReview: assessments.filter(a => a.assessmentStatus === 'pending_review').length,
          pendingPayment: assessments.filter(a => a.assessmentStatus === 'pending_payment').length,
          forVerification: assessments.filter(a => a.paymentStatus === 'for_verification').length,
          paid: assessments.filter(a => a.paymentStatus === 'paid').length,
          scheduled: assessments.filter(a => a.assessmentStatus === 'scheduled').length,
          completed: assessments.filter(a => a.assessmentStatus === 'completed').length
        }
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/free-quotes/${id}/status`,
        { status },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Status updated successfully', 'success');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error updating status:', error);
      showToast('Failed to update status', 'error');
    }
  };

  const handleApproveBooking = async (approved) => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/pre-assessments/${selectedItem._id}/approve-booking`,
        { approved, notes: approveNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(approved ? 'Booking approved! Invoice generated.' : 'Booking rejected.', approved ? 'success' : 'warning');
      setShowApproveModal(false);
      setSelectedItem(null);
      setApproveNotes('');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error approving booking:', error);
      showToast('Failed to process booking', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyPayment = async (verified) => {
    if (!selectedItem) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${import.meta.env.VITE_API_URL}/api/pre-assessments/${selectedItem._id}/verify-payment`,
        { verified, notes: verificationNote },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast(verified ? 'Payment verified successfully!' : 'Payment rejected', verified ? 'success' : 'warning');
      setShowVerifyModal(false);
      setSelectedItem(null);
      setVerificationNote('');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error verifying payment:', error);
      showToast('Failed to verify payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignEngineer = async () => {
    if (!selectedItem || !engineerId) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');

      if (activeTab === 'free-quotes') {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/free-quotes/${selectedItem._id}/assign-engineer`,
          { engineerId, notes: siteVisitNotes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast('Engineer assigned to free quote successfully', 'success');
      } else {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/pre-assessments/${selectedItem._id}/assign-engineer`,
          { engineerId, siteVisitDate, notes: siteVisitNotes },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (siteVisitDate) {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/schedules/create-from-preassessment`,
            {
              preAssessmentId: selectedItem._id,
              engineerId: engineerId,
              siteVisitDate: siteVisitDate,
              siteVisitTime: '09:00'
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        showToast('Engineer assigned and schedule created successfully', 'success');
      }

      setShowAssignEngineerModal(false);
      setSelectedItem(null);
      setEngineerId('');
      setSiteVisitDate('');
      setSiteVisitNotes('');
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error assigning engineer:', error);
      showToast(error.response?.data?.message || 'Failed to assign engineer', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignDevice = async () => {
    if (!selectedItem || !deviceId) return;

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/admin/devices/${deviceId}/assign`,
        {
          engineerId: selectedItem.assignedEngineerId,
          preAssessmentId: selectedItem._id,
          notes: `Assigned to pre-assessment ${selectedItem.bookingReference}`
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Device assigned successfully to the pre-assessment', 'success');
      setShowAssignDeviceModal(false);
      setSelectedItem(null);
      setDeviceId('');

      await fetchData();
      await fetchStats();
      await fetchDevices();
    } catch (error) {
      console.error('Error assigning device:', error);
      showToast(error.response?.data?.message || 'Failed to assign device', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUploadQuotation = async () => {
    if (!selectedItem || !quotationFile) return;

    setUploading(true);
    try {
      const token = sessionStorage.getItem('token');
      const formData = new FormData();
      formData.append('quotation', quotationFile);

      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/free-quotes/${selectedItem._id}/upload-quotation`,
        formData,
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' } }
      );

      showToast('Quotation uploaded and sent to customer', 'success');
      setShowUploadModal(false);
      setSelectedItem(null);
      setQuotationFile(null);
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error uploading quotation:', error);
      showToast('Failed to upload quotation', 'error');
    } finally {
      setUploading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status, type) => {
    const badges = {
      'free-quote': {
        'pending': <span className="status-badge-siteassesad pending-siteassesad">Pending</span>,
        'assigned': <span className="status-badge-siteassesad assigned-siteassesad">Assigned</span>,
        'processing': <span className="status-badge-siteassesad processing-siteassesad">Processing</span>,
        'completed': <span className="status-badge-siteassesad completed-siteassesad">Completed</span>,
        'cancelled': <span className="status-badge-siteassesad cancelled-siteassesad">Cancelled</span>
      },
      'pre-assessment': {
        'pending_review': <span className="status-badge-siteassesad pending-review-siteassesad">Pending Review</span>,
        'pending_payment': <span className="status-badge-siteassesad pending-siteassesad">Pending Payment</span>,
        'pending': <span className="status-badge-siteassesad pending-siteassesad">Pending</span>,
        'for_verification': <span className="status-badge-siteassesad for-verification-siteassesad">For Verification</span>,
        'paid': <span className="status-badge-siteassesad paid-siteassesad">Paid</span>,
        'scheduled': <span className="status-badge-siteassesad scheduled-siteassesad">Scheduled</span>,
        'site_visit_ongoing': <span className="status-badge-siteassesad site-visit-ongoing-siteassesad">Site Visit Ongoing</span>,
        'device_deployed': <span className="status-badge-siteassesad deployed-siteassesad">Device Deployed</span>,
        'data_collecting': <span className="status-badge-siteassesad collecting-siteassesad">Data Collecting</span>,
        'completed': <span className="status-badge-siteassesad completed-siteassesad">Completed</span>
      }
    };
    return badges[type]?.[status] || <span className="status-badge-siteassesad">{status}</span>;
  };

  const getDisplayStatus = (item) => {
    if (activeTab === 'pre-assessments') {
      if (item.assessmentStatus === 'pending_review') {
        return 'pending_review';
      }
      
      if (item.paymentStatus !== 'paid' && item.paymentStatus !== 'pending' && item.assessmentStatus !== 'pending_payment') {
        return item.paymentStatus;
      }

      if (item.assessmentStatus === 'device_deployed' ||
        item.assessmentStatus === 'data_collecting' ||
        item.assessmentStatus === 'data_analyzing' ||
        item.assessmentStatus === 'report_draft' ||
        item.assessmentStatus === 'completed') {
        return item.assessmentStatus;
      }

      const hasDeviceAssigned = item.assignedDeviceId || item.iotDeviceId || item.assignedDevice;
      const hasEngineerAssigned = item.assignedEngineerId;

      if (hasEngineerAssigned && hasDeviceAssigned) {
        return 'site_visit_ongoing';
      }

      if (hasEngineerAssigned && !hasDeviceAssigned) {
        return 'scheduled';
      }

      return item.assessmentStatus || 'scheduled';
    }
    return item.status;
  };

  const filteredItems = (activeTab === 'free-quotes' ? freeQuotes : preAssessments).filter(item => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return item.clientId?.contactFirstName?.toLowerCase().includes(searchLower) ||
      item.clientId?.contactLastName?.toLowerCase().includes(searchLower) ||
      (activeTab === 'free-quotes' ? item.quotationReference : item.bookingReference)?.toLowerCase().includes(searchLower);
  });

  const getEngineerName = (engineer) => {
    if (!engineer) return 'Not assigned';
    if (typeof engineer === 'object') {
      return engineer.name || engineer.fullName || engineer.email || 'Engineer assigned';
    }
    return engineer;
  };

  const getDeviceId = (device) => {
    if (!device) return 'Not assigned';
    if (typeof device === 'object') {
      return device.deviceId || device._id || 'Device assigned';
    }
    return device;
  };

  const hasDeviceAssigned = (item) => {
    return item.assignedDeviceId || item.iotDeviceId || item.assignedDevice;
  };

  const SkeletonLoader = () => (
    <div className="site-assessment-siteassesad">
      <div className="assessment-header-siteassesad">
        <div className="skeleton-line-siteassesad large-siteassesad"></div>
        <div className="skeleton-line-siteassesad medium-siteassesad"></div>
      </div>
      <div className="assessment-stats-siteassesad">
        {[1, 2].map(i => (
          <div key={i} className="stat-card-siteassesad skeleton-card-siteassesad">
            <div className="skeleton-line-siteassesad small-siteassesad"></div>
            <div className="skeleton-line-siteassesad large-siteassesad"></div>
          </div>
        ))}
      </div>
      <div className="assessment-tabs-siteassesad">
        <div className="skeleton-button-siteassesad"></div>
        <div className="skeleton-button-siteassesad"></div>
      </div>
      <div className="assessment-table-container-siteassesad">
        <div className="skeleton-table-siteassesad">
          <div className="skeleton-table-header-siteassesad"></div>
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="skeleton-table-row-siteassesad"></div>
          ))}
        </div>
      </div>
    </div>
  );

  if (loading && (activeTab === 'free-quotes' ? freeQuotes.length === 0 : preAssessments.length === 0)) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet>
        <title>Site Assessment | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="site-assessment-siteassesad">
        <div className="assessment-header-siteassesad">
          <h1>Site Assessment Management</h1>
          <p>Manage free quote requests and pre-assessment bookings</p>
        </div>

        <div className="assessment-stats-siteassesad">
          <div className="stat-card-siteassesad free-quote-siteassesad">
            <div className="stat-info-siteassesad">
              <span className="stat-value-siteassesad">{stats.freeQuotes.total}</span>
              <span className="stat-label-siteassesad">Free Quotes</span>
              <div className="stat-detail-siteassesad">
                <span>Pending: {stats.freeQuotes.pending}</span>
                <span>Assigned: {stats.freeQuotes.assigned}</span>
                <span>Processing: {stats.freeQuotes.processing}</span>
                <span>Completed: {stats.freeQuotes.completed}</span>
              </div>
            </div>
          </div>
          <div className="stat-card-siteassesad pre-assessment-siteassesad">
            <div className="stat-info-siteassesad">
              <span className="stat-value-siteassesad">{stats.preAssessments.total}</span>
              <span className="stat-label-siteassesad">Pre-Assessments</span>
              <div className="stat-detail-siteassesad">
                <span>Pending Review: {stats.preAssessments.pendingReview}</span>
                <span>For Verification: {stats.preAssessments.forVerification}</span>
                <span>Completed: {stats.preAssessments.completed}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="assessment-tabs-siteassesad">
          <button
            className={`tab-btn-siteassesad ${activeTab === 'free-quotes' ? 'active-siteassesad' : ''}`}
            onClick={() => { setActiveTab('free-quotes'); setFilter('all'); setCurrentPage(1); }}
          >
            Free Quotes
          </button>
          <button
            className={`tab-btn-siteassesad ${activeTab === 'pre-assessments' ? 'active-siteassesad' : ''}`}
            onClick={() => { setActiveTab('pre-assessments'); setFilter('all'); setCurrentPage(1); }}
          >
            Pre-Assessments
          </button>
        </div>

        <div className="assessment-filters-siteassesad">
          <div className="filter-group-siteassesad">
            <select value={filter} onChange={(e) => setFilter(e.target.value)}>
              <option value="all">All Status</option>
              {activeTab === 'free-quotes' ? (
                <>
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                </>
              ) : (
                <>
                  <option value="pending_review">Pending Review</option>
                  <option value="pending_payment">Pending Payment</option>
                  <option value="for_verification">For Verification</option>
                  <option value="paid">Paid</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="site_visit_ongoing">Site Visit Ongoing</option>
                  <option value="device_deployed">Device Deployed</option>
                  <option value="completed">Completed</option>
                </>
              )}
            </select>
          </div>
          <div className="search-group-siteassesad">
            <FaSearch className="search-icon-siteassesad" />
            <input
              type="text"
              placeholder="Search by client name or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="assessment-table-container-siteassesad">
          <table className="assessment-table-siteassesad">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Client</th>
                <th>Contact</th>
                <th>Date</th>
                {activeTab === 'free-quotes' ? <th>Monthly Bill</th> : <th>Property Type</th>}
                {activeTab === 'free-quotes' ? <th>Capacity</th> : <th>Amount</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state-siteassesad">
                    <p>No {activeTab === 'free-quotes' ? 'free quotes' : 'pre-assessments'} found</p>
                  </td>
                </tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item._id}>
                    <td className="ref-cell-siteassesad">
                      {activeTab === 'free-quotes' ? item.quotationReference : item.bookingReference}
                    </td>
                    <td>
                      {item.clientId?.contactFirstName} {item.clientId?.contactLastName}
                    </td>
                    <td>
                      <div>{item.clientId?.contactNumber || 'N/A'}</div>
                      <div className="email-cell-siteassesad">{item.clientId?.userId?.email || 'N/A'}</div>
                    </td>
                    <td>{formatDate(activeTab === 'free-quotes' ? item.requestedAt : item.bookedAt)}</td>
                    {activeTab === 'free-quotes' ? (
                      <>
                        <td className="amount-cell-siteassesad">{formatCurrency(item.monthlyBill)}</td>
                        <td>{item.desiredCapacity || 'N/A'}</td>
                      </>
                    ) : (
                      <>
                        <td>{item.propertyType}</td>
                        <td className="amount-cell-siteassesad">{formatCurrency(item.assessmentFee)}</td>
                      </>
                    )}
                    <td>{getStatusBadge(getDisplayStatus(item), activeTab === 'free-quotes' ? 'free-quote' : 'pre-assessment')}</td>
                    <td className="actions-cell-siteassesad">
                      <button
                        className="action-btn-siteassesad view-siteassesad"
                        onClick={() => { setSelectedItem(item); setShowDetailModal(true); }}
                        title="View Details"
                      >
                        <FaEye />
                      </button>

                      {activeTab === 'pre-assessments' && item.assessmentStatus === 'pending_review' && (
                        <>
                          <button
                            className="action-btn-siteassesad approve-booking-siteassesad"
                            onClick={() => { setSelectedItem(item); setShowApproveModal(true); }}
                            title="Approve Booking"
                          >
                            <FaCheckCircle />
                          </button>
                          <button
                            className="action-btn-siteassesad reject-booking-siteassesad"
                            onClick={() => handleApproveBooking(false)}
                            title="Reject Booking"
                          >
                            <FaTimesCircle />
                          </button>
                        </>
                      )}

                      {activeTab === 'free-quotes' && item.status === 'pending' && (
                        <button
                          className="action-btn-siteassesad assign-siteassesad"
                          onClick={() => { setSelectedItem(item); setShowAssignEngineerModal(true); }}
                          title="Assign Engineer"
                        >
                          <FaUserCog />
                        </button>
                      )}

                      {activeTab === 'free-quotes' && item.status === 'assigned' && (
                        <button
                          className="action-btn-siteassesad process-siteassesad"
                          onClick={() => handleUpdateStatus(item._id, 'processing')}
                          title="Mark as Processing"
                        >
                          <FaTools />
                        </button>
                      )}

                      {activeTab === 'free-quotes' && item.status === 'processing' && (
                        <button
                          className="action-btn-siteassesad complete-siteassesad"
                          onClick={() => handleUpdateStatus(item._id, 'completed')}
                          title="Mark as Completed"
                        >
                          <FaCheckCircle />
                        </button>
                      )}

                      {activeTab === 'pre-assessments' && item.paymentStatus === 'for_verification' && (
                        <>
                          <button
                            className="action-btn-siteassesad verify-siteassesad"
                            onClick={() => { setSelectedItem(item); setShowVerifyModal(true); }}
                            title="Verify Payment"
                          >
                            <FaCheckCircle />
                          </button>
                          <button
                            className="action-btn-siteassesad reject-siteassesad"
                            onClick={() => handleVerifyPayment(false)}
                            title="Reject Payment"
                          >
                            <FaTimesCircle />
                          </button>
                        </>
                      )}

                      {activeTab === 'pre-assessments' &&
                        item.paymentStatus === 'paid' &&
                        item.assessmentStatus === 'scheduled' &&
                        !item.assignedEngineerId && (
                          <button
                            className="action-btn-siteassesad assign-siteassesad"
                            onClick={() => { setSelectedItem(item); setShowAssignEngineerModal(true); }}
                            title="Assign Engineer"
                          >
                            <FaUserCog />
                          </button>
                        )}

                      {activeTab === 'pre-assessments' &&
                        item.paymentStatus === 'paid' &&
                        item.assignedEngineerId &&
                        !hasDeviceAssigned(item) && (
                          <button
                            className="action-btn-siteassesad assign-device-siteassesad"
                            onClick={() => { setSelectedItem(item); setShowAssignDeviceModal(true); }}
                            title="Assign Device"
                          >
                            <FaMicrochip />
                          </button>
                        )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination-siteassesad">
            <button
              className="page-btn-siteassesad"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <FaChevronLeft /> Previous
            </button>
            <span className="page-info-siteassesad">Page {currentPage} of {totalPages}</span>
            <button
              className="page-btn-siteassesad"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              Next <FaChevronRight />
            </button>
          </div>
        )}

        {/* Approve Booking Modal */}
        {showApproveModal && selectedItem && (
          <div className="modal-overlay-siteassesad" onClick={() => setShowApproveModal(false)}>
            <div className="modal-content-siteassesad" onClick={e => e.stopPropagation()}>
              <h3>Approve Pre-Assessment Booking</h3>
              
              <div className="modal-body-siteassesad">
                <div className="booking-details-siteassesad">
                  <div className="detail-row-siteassesad"><span>Booking Reference:</span><strong>{selectedItem.bookingReference}</strong></div>
                  <div className="detail-row-siteassesad"><span>Client:</span><strong>{selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</strong></div>
                  <div className="detail-row-siteassesad"><span>Property Type:</span><strong>{selectedItem.propertyType}</strong></div>
                  <div className="detail-row-siteassesad"><span>Preferred Date:</span><strong>{formatDate(selectedItem.preferredDate)}</strong></div>
                  <div className="detail-row-siteassesad"><span>Assessment Fee:</span><strong>{formatCurrency(selectedItem.assessmentFee)}</strong></div>
                  <div className="detail-row-siteassesad"><span>Address:</span><strong>{selectedItem.addressId?.houseOrBuilding} {selectedItem.addressId?.street}, {selectedItem.addressId?.barangay}, {selectedItem.addressId?.cityMunicipality}</strong></div>
                </div>

                <div className="form-group-siteassesad">
                  <label>Notes (Optional)</label>
                  <textarea
                    rows="3"
                    value={approveNotes}
                    onChange={(e) => setApproveNotes(e.target.value)}
                    placeholder="Add any notes about this approval..."
                  />
                </div>

                <div className="info-box-siteassesad">
                  <FaInfoCircle />
                  <small>Approving this booking will generate an invoice for the customer.</small>
                </div>
              </div>

              <div className="modal-actions-siteassesad">
                <button className="cancel-btn-siteassesad" onClick={() => setShowApproveModal(false)}>Cancel</button>
                <button className="reject-btn-siteassesad" onClick={() => handleApproveBooking(false)}>Reject</button>
                <button className="approve-btn-siteassesad" onClick={() => handleApproveBooking(true)} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Approve & Generate Invoice'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="modal-overlay-siteassesad" onClick={() => setShowDetailModal(false)}>
            <div className="modal-content-siteassesad detail-modal-siteassesad" onClick={e => e.stopPropagation()}>
              <button className="modal-close-siteassesad" onClick={() => setShowDetailModal(false)}>×</button>
              <h3>Assessment Details</h3>
              <div className="detail-section-siteassesad">
                <h4>Client Information</h4>
                <p><strong>Name:</strong> {selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</p>
                <p><strong>Email:</strong> {selectedItem.clientId?.userId?.email}</p>
                <p><strong>Contact:</strong> {selectedItem.clientId?.contactNumber}</p>
                <p><strong>Address:</strong> {selectedItem.addressId?.houseOrBuilding} {selectedItem.addressId?.street}, {selectedItem.addressId?.barangay}, {selectedItem.addressId?.cityMunicipality}</p>
              </div>
              {activeTab === 'free-quotes' ? (
                <div className="detail-section-siteassesad">
                  <h4>Quote Details</h4>
                  <p><strong>Reference:</strong> {selectedItem.quotationReference}</p>
                  <p><strong>Monthly Bill:</strong> {formatCurrency(selectedItem.monthlyBill)}</p>
                  <p><strong>Property Type:</strong> {selectedItem.propertyType}</p>
                  <p><strong>Desired Capacity:</strong> {selectedItem.desiredCapacity || 'Not specified'}</p>
                  <p><strong>Status:</strong> {selectedItem.status}</p>
                  <p><strong>Requested:</strong> {formatDate(selectedItem.requestedAt)}</p>
                  {selectedItem.assignedEngineerId && (
                    <p><strong>Assigned Engineer:</strong> {getEngineerName(selectedItem.assignedEngineerId)}</p>
                  )}
                </div>
              ) : (
                <div className="detail-section-siteassesad">
                  <h4>Assessment Details</h4>
                  <p><strong>Reference:</strong> {selectedItem.bookingReference}</p>
                  <p><strong>Invoice:</strong> {selectedItem.invoiceNumber || 'Not yet generated'}</p>
                  <p><strong>Property Type:</strong> {selectedItem.propertyType}</p>
                  <p><strong>Roof Type:</strong> {selectedItem.roofType || 'Not specified'}</p>
                  <p><strong>Preferred Date:</strong> {formatDate(selectedItem.preferredDate)}</p>
                  <p><strong>Assessment Fee:</strong> {formatCurrency(selectedItem.assessmentFee)}</p>
                  <p><strong>Payment Status:</strong> {selectedItem.paymentStatus}</p>
                  <p><strong>Assessment Status:</strong> {selectedItem.assessmentStatus}</p>
                  <p><strong>Assigned Engineer:</strong> {getEngineerName(selectedItem.assignedEngineerId)}</p>
                  <p><strong>Assigned Device:</strong> {getDeviceId(selectedItem.assignedDeviceId || selectedItem.iotDeviceId || selectedItem.assignedDevice)}</p>
                </div>
              )}
              <div className="modal-actions-siteassesad">
                <button className="cancel-btn-siteassesad" onClick={() => setShowDetailModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* Verify Payment Modal */}
        {showVerifyModal && selectedItem && (
          <div className="modal-overlay-siteassesad" onClick={() => setShowVerifyModal(false)}>
            <div className="modal-content-siteassesad" onClick={e => e.stopPropagation()}>
              <h3>Verify Payment</h3>
              <div className="payment-info-siteassesad">
                <p><strong>Reference:</strong> {selectedItem.bookingReference}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedItem.assessmentFee)}</p>
                <p><strong>Method:</strong> {selectedItem.paymentMethod?.toUpperCase()}</p>
                <p><strong>Reference #:</strong> {selectedItem.paymentReference || 'N/A'}</p>
              </div>
              <div className="form-group-siteassesad">
                <label>Verification Notes (Optional)</label>
                <textarea
                  rows="3"
                  value={verificationNote}
                  onChange={(e) => setVerificationNote(e.target.value)}
                  placeholder="Add any notes about this verification..."
                />
              </div>
              <div className="modal-actions-siteassesad">
                <button className="cancel-btn-siteassesad" onClick={() => setShowVerifyModal(false)}>Cancel</button>
                <button className="reject-btn-siteassesad" onClick={() => handleVerifyPayment(false)} disabled={isSubmitting}>Reject</button>
                <button className="verify-btn-siteassesad" onClick={() => handleVerifyPayment(true)} disabled={isSubmitting}>
                  {isSubmitting ? 'Processing...' : 'Verify & Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Engineer Modal */}
        {showAssignEngineerModal && selectedItem && (
          <div className="modal-overlay-siteassesad" onClick={() => setShowAssignEngineerModal(false)}>
            <div className="modal-content-siteassesad" onClick={e => e.stopPropagation()}>
              <h3>Assign Engineer to {activeTab === 'free-quotes' ? 'Free Quote' : 'Pre-Assessment'}</h3>
              <div className="assessment-summary-siteassesad">
                <p><strong>{activeTab === 'free-quotes' ? 'Quote' : 'Assessment'}:</strong>
                  {activeTab === 'free-quotes' ? selectedItem.quotationReference : selectedItem.bookingReference}
                </p>
                <p><strong>Client:</strong> {selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</p>
                <p><strong>Address:</strong> {selectedItem.addressId?.houseOrBuilding} {selectedItem.addressId?.street}, {selectedItem.addressId?.barangay}</p>
                {activeTab === 'free-quotes' && (
                  <p><strong>Monthly Bill:</strong> {formatCurrency(selectedItem.monthlyBill)}</p>
                )}
              </div>
              <div className="form-group-siteassesad">
                <label>Select Engineer</label>
                <select value={engineerId} onChange={(e) => setEngineerId(e.target.value)}>
                  <option value="">Select an engineer...</option>
                  {engineers.map(eng => (
                    <option key={eng._id} value={eng._id}>{eng.fullName} ({eng.email})</option>
                  ))}
                </select>
              </div>
              {activeTab !== 'free-quotes' && (
                <div className="form-group-siteassesad">
                  <label>Site Visit Date</label>
                  <input type="date" value={siteVisitDate} onChange={(e) => setSiteVisitDate(e.target.value)} />
                </div>
              )}
              <div className="form-group-siteassesad">
                <label>Notes (Optional)</label>
                <textarea rows="3" value={siteVisitNotes} onChange={(e) => setSiteVisitNotes(e.target.value)}
                  placeholder={activeTab === 'free-quotes' ? "Add notes about this assignment..." : "Add any notes for the engineer..."}
                />
              </div>
              <div className="info-box-siteassesad">
                <FaInfoCircle />
                <small>
                  {activeTab === 'free-quotes'
                    ? "The engineer will review the free quote and provide a quotation."
                    : "After assigning an engineer, you can then assign a device for this assessment."}
                </small>
              </div>
              <div className="modal-actions-siteassesad">
                <button className="cancel-btn-siteassesad" onClick={() => setShowAssignEngineerModal(false)}>Cancel</button>
                <button className="assign-btn-siteassesad" onClick={handleAssignEngineer} disabled={!engineerId || isSubmitting}>
                  {isSubmitting ? 'Assigning...' : 'Assign Engineer'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Device Modal */}
        {showAssignDeviceModal && selectedItem && (
          <div className="modal-overlay-siteassesad" onClick={() => setShowAssignDeviceModal(false)}>
            <div className="modal-content-siteassesad" onClick={e => e.stopPropagation()}>
              <h3>Assign Device to Pre-Assessment</h3>
              <div className="assessment-summary-siteassesad">
                <p><strong>Assessment:</strong> {selectedItem.bookingReference}</p>
                <p><strong>Client:</strong> {selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</p>
                <p><strong>Address:</strong> {selectedItem.addressId?.houseOrBuilding} {selectedItem.addressId?.street}, {selectedItem.addressId?.barangay}</p>
                <p><strong>Assigned Engineer:</strong> {getEngineerName(selectedItem.assignedEngineerId)}</p>
              </div>
              <div className="form-group-siteassesad">
                <label>Select IoT Device</label>
                <select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}>
                  <option value="">Select an available device...</option>
                  {devices.map(device => (
                    <option key={device._id} value={device._id}>
                      {device.deviceId} - {device.deviceName} ({device.model})
                    </option>
                  ))}
                </select>
                {devices.length === 0 && (
                  <small className="warning-text">No available devices. Please add devices in IoT Device Management.</small>
                )}
              </div>
              <div className="info-box-siteassesad">
                <FaWifi />
                <small>The selected device will be assigned to this pre-assessment. The engineer will deploy it on site during the site visit.</small>
              </div>
              <div className="modal-actions-siteassesad">
                <button className="cancel-btn-siteassesad" onClick={() => setShowAssignDeviceModal(false)}>Cancel</button>
                <button className="assign-btn-siteassesad" onClick={handleAssignDevice} disabled={!deviceId || isSubmitting}>
                  {isSubmitting ? 'Assigning...' : 'Assign Device'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Quotation Modal */}
        {showUploadModal && selectedItem && (
          <div className="modal-overlay-siteassesad" onClick={() => setShowUploadModal(false)}>
            <div className="modal-content-siteassesad" onClick={e => e.stopPropagation()}>
              <h3>Upload Quotation</h3>
              <div className="quote-summary-siteassesad">
                <p><strong>Quote Reference:</strong> {selectedItem.quotationReference}</p>
                <p><strong>Client:</strong> {selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</p>
                <p><strong>Monthly Bill:</strong> {formatCurrency(selectedItem.monthlyBill)}</p>
              </div>
              <div className="form-group-siteassesad">
                <label>Quotation File (PDF)</label>
                <input type="file" accept=".pdf" onChange={(e) => setQuotationFile(e.target.files[0])} />
                <small>Upload the quotation PDF. This will be sent to the customer via email.</small>
              </div>
              <div className="modal-actions-siteassesad">
                <button className="cancel-btn-siteassesad" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button className="upload-btn-siteassesad" onClick={handleUploadQuotation} disabled={!quotationFile || uploading}>
                  {uploading ? 'Uploading...' : 'Upload & Send'}
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      </div>
    </>
  );
};

export default SiteAssessment;