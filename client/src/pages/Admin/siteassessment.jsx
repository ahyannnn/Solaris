// src/pages/Admin/SiteAssessment.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaSearch,
  FaEye,
  FaCheckCircle,
  FaTimesCircle,
  FaDownload,
  FaInfoCircle,
  FaChevronLeft,
  FaChevronRight,
  FaUserCog,
  FaMicrochip,
  FaMoneyBillWave,
  FaTools,
  FaWifi
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/siteassessment.css';

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
    preAssessments: { total: 0, pendingReview: 0, pendingPayment: 0, forVerification: 0, paid: 0, scheduled: 0, completed: 0, autoVerified: 0 }
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
      const autoVerified = assessments.filter(a => a.autoVerified === true || a.paymentGateway === 'paymongo').length;

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
          completed: assessments.filter(a => a.assessmentStatus === 'completed').length,
          autoVerified: autoVerified
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
            { preAssessmentId: selectedItem._id, engineerId, siteVisitDate, siteVisitTime: '09:00' },
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
        { engineerId: selectedItem.assignedEngineerId, preAssessmentId: selectedItem._id, notes: `Assigned to pre-assessment ${selectedItem.bookingReference}` },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Device assigned successfully', 'success');
      setShowAssignDeviceModal(false);
      setSelectedItem(null);
      setDeviceId('');
      fetchData();
      fetchStats();
      fetchDevices();
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
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getStatusBadge = (status, type) => {
    const badges = {
      'free-quote': {
        'pending': <span className="status-badge pending">Pending</span>,
        'assigned': <span className="status-badge assigned">Assigned</span>,
        'processing': <span className="status-badge processing">Processing</span>,
        'completed': <span className="status-badge completed">Completed</span>
      },
      'pre-assessment': {
        'pending_review': <span className="status-badge pending-review">Pending Review</span>,
        'pending_payment': <span className="status-badge pending">Pending Payment</span>,
        'for_verification': <span className="status-badge verification">For Verification</span>,
        'paid': <span className="status-badge paid">Paid</span>,
        'scheduled': <span className="status-badge scheduled">Scheduled</span>,
        'site_visit_ongoing': <span className="status-badge site-visit">Site Visit</span>,
        'device_deployed': <span className="status-badge deployed">Device Deployed</span>,
        'data_collecting': <span className="status-badge collecting">Collecting</span>,
        'completed': <span className="status-badge completed">Completed</span>
      }
    };
    return badges[type]?.[status] || <span className="status-badge">{status}</span>;
  };

  const getDisplayStatus = (item) => {
    if (activeTab === 'pre-assessments') {
      if (item.assessmentStatus === 'pending_review') return 'pending_review';
      if (item.paymentStatus !== 'paid' && item.paymentStatus !== 'pending' && item.assessmentStatus !== 'pending_payment') return item.paymentStatus;
      if (['device_deployed', 'data_collecting', 'data_analyzing', 'report_draft', 'completed'].includes(item.assessmentStatus)) return item.assessmentStatus;
      const hasDeviceAssigned = item.assignedDeviceId || item.iotDeviceId || item.assignedDevice;
      const hasEngineerAssigned = item.assignedEngineerId;
      if (hasEngineerAssigned && hasDeviceAssigned) return 'site_visit_ongoing';
      if (hasEngineerAssigned && !hasDeviceAssigned) return 'scheduled';
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

    // If engineer is an object (like your case: {_id: '...', email: '...'})
    if (typeof engineer === 'object') {
      // Check if it has fullName directly
      if (engineer.fullName) return engineer.fullName;
      if (engineer.name) return engineer.name;

      // If it has firstName and lastName
      if (engineer.firstName && engineer.lastName) {
        return `${engineer.firstName} ${engineer.lastName}`;
      }

      // If it has an _id, find it in the engineers array
      if (engineer._id) {
        const foundEngineer = engineers.find(eng => eng._id === engineer._id);
        

        if (foundEngineer) {
          return foundEngineer.fullName ||
            foundEngineer.name ||
            `${foundEngineer.firstName || ''} ${foundEngineer.lastName || ''}`.trim() ||
            foundEngineer.email ||
            'Engineer assigned';
        }
      }

      // If it has email only, return formatted name from email
      if (engineer.email) {
        const emailName = engineer.email.split('@')[0];
        const formattedName = emailName
          .replace(/[._-]/g, ' ')
          .split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        return formattedName || 'Engineer assigned';
      }

      return 'Engineer assigned';
    }

    // If engineer is a string (ID)
    if (typeof engineer === 'string') {
      const foundEngineer = engineers.find(eng => eng._id === engineer || eng.id === engineer);
      if (foundEngineer) {
        return foundEngineer.fullName ||
          foundEngineer.name ||
          `${foundEngineer.firstName || ''} ${foundEngineer.lastName || ''}`.trim() ||
          foundEngineer.email ||
          'Engineer assigned';
      }
      return 'Not assigned';
    }

    return 'Not assigned';
  };

  const getDeviceId = (device) => {
    if (!device) return 'Not assigned';
    if (typeof device === 'object') return device.deviceId || device._id || 'Device assigned';
    return device;
  };

  const hasDeviceAssigned = (item) => {
    return item.assignedDeviceId || item.iotDeviceId || item.assignedDevice;
  };

  const SkeletonLoader = () => (
    <div className="site-assessment">
      <div className="assessment-header"><div className="skeleton-title"></div><div className="skeleton-subtitle"></div></div>
      <div className="assessment-stats">
        <div className="stat-card skeleton"><div className="skeleton-line large"></div><div className="skeleton-line small"></div></div>
        <div className="stat-card skeleton"><div className="skeleton-line large"></div><div className="skeleton-line small"></div></div>
      </div>
      <div className="assessment-tabs"><div className="skeleton-tab"></div><div className="skeleton-tab"></div></div>
      <div className="skeleton-table"></div>
    </div>
  );

  if (loading && (activeTab === 'free-quotes' ? freeQuotes.length === 0 : preAssessments.length === 0)) {
    return <SkeletonLoader />;
  }

  return (
    <>
      <Helmet><title>Site Assessment | Admin | Salfer Engineering</title></Helmet>

      <div className="site-assessment">
        <div className="assessment-header">
          <h1>Site Assessment</h1>
          <p>Manage free quote requests and pre-assessment bookings</p>
        </div>

        <div className="assessment-stats">
          <div className="stat-card free-quote">
            <div className="stat-info">
              <span className="stat-value">{stats.freeQuotes.total}</span>
              <span className="stat-label">Free Quotes</span>
              <div className="stat-detail">
                <span>Pending: {stats.freeQuotes.pending}</span>
                <span>Assigned: {stats.freeQuotes.assigned}</span>
                <span>Processing: {stats.freeQuotes.processing}</span>
                <span>Completed: {stats.freeQuotes.completed}</span>
              </div>
            </div>
          </div>
          <div className="stat-card pre-assessment">
            <div className="stat-info">
              <span className="stat-value">{stats.preAssessments.total}</span>
              <span className="stat-label">Pre-Assessments</span>
              <div className="stat-detail">
                <span>Pending Review: {stats.preAssessments.pendingReview}</span>
                <span>Auto-Verified: {stats.preAssessments.autoVerified}</span>
                <span>Completed: {stats.preAssessments.completed}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="assessment-tabs">
          <button className={`tab-btn ${activeTab === 'free-quotes' ? 'active' : ''}`} onClick={() => { setActiveTab('free-quotes'); setFilter('all'); setCurrentPage(1); }}>Free Quotes</button>
          <button className={`tab-btn ${activeTab === 'pre-assessments' ? 'active' : ''}`} onClick={() => { setActiveTab('pre-assessments'); setFilter('all'); setCurrentPage(1); }}>Pre-Assessments</button>
        </div>

        <div className="assessment-filters">
          <div className="filter-group">
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
                  <option value="completed">Completed</option>
                </>
              )}
            </select>
          </div>
          <div className="search-group">
            <FaSearch className="search-icon" />
            <input type="text" placeholder="Search by client name or reference..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reference</th>
                <th>Client</th>
                <th>Contact</th>
                <th>Date</th>
                {activeTab === 'free-quotes' ? <th>Monthly Bill</th> : <th>Property</th>}
                {activeTab === 'free-quotes' ? <th>Capacity</th> : <th>Amount</th>}
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length === 0 ? (
                <tr><td colSpan="8" className="empty-state">No {activeTab === 'free-quotes' ? 'free quotes' : 'pre-assessments'} found</td></tr>
              ) : (
                filteredItems.map(item => (
                  <tr key={item._id}>
                    <td className="ref-cell">{activeTab === 'free-quotes' ? item.quotationReference : item.bookingReference}</td>
                    <td>{item.clientId?.contactFirstName} {item.clientId?.contactLastName}</td>
                    <td><div>{item.clientId?.contactNumber || 'N/A'}</div><div className="email-cell">{item.clientId?.userId?.email || 'N/A'}</div></td>
                    <td>{formatDate(activeTab === 'free-quotes' ? item.requestedAt : item.bookedAt)}</td>
                    {activeTab === 'free-quotes' ? (
                      <>
                        <td className="amount-cell">{formatCurrency(item.monthlyBill)}</td>
                        <td>{item.desiredCapacity || 'N/A'}</td>
                      </>
                    ) : (
                      <>
                        <td>{item.propertyType}</td>
                        <td className="amount-cell">{formatCurrency(item.assessmentFee)}</td>
                      </>
                    )}
                    <td>{getStatusBadge(getDisplayStatus(item), activeTab === 'free-quotes' ? 'free-quote' : 'pre-assessment')}</td>
                    <td className="actions-cell">
                      <button className="action-btn view" onClick={() => { setSelectedItem(item); setShowDetailModal(true); }} title="View Details"><FaEye /></button>

                      {activeTab === 'pre-assessments' && item.assessmentStatus === 'pending_review' && (
                        <>
                          <button className="action-btn approve" onClick={() => { setSelectedItem(item); setShowApproveModal(true); }} title="Approve"><FaCheckCircle /></button>
                          <button className="action-btn reject" onClick={() => handleApproveBooking(false)} title="Reject"><FaTimesCircle /></button>
                        </>
                      )}

                      {activeTab === 'free-quotes' && item.status === 'pending' && (
                        <button className="action-btn assign" onClick={() => { setSelectedItem(item); setShowAssignEngineerModal(true); }} title="Assign Engineer"><FaUserCog /></button>
                      )}

                      {activeTab === 'free-quotes' && item.status === 'assigned' && (
                        <button className="action-btn process" onClick={() => handleUpdateStatus(item._id, 'processing')} title="Process"><FaTools /></button>
                      )}

                      {activeTab === 'free-quotes' && item.status === 'processing' && (
                        <>
                          <button className="action-btn upload" onClick={() => { setSelectedItem(item); setShowUploadModal(true); }} title="Upload Quotation"><FaDownload /></button>
                          <button className="action-btn complete" onClick={() => handleUpdateStatus(item._id, 'completed')} title="Complete"><FaCheckCircle /></button>
                        </>
                      )}

                      {(item.paymentGateway === 'paymongo' || item.autoVerified === true) && item.paymentStatus === 'paid' && (
                        <span className="auto-badge" title="Auto-verified via PayMongo"><FaCheckCircle /> Auto</span>
                      )}

                      {activeTab === 'pre-assessments' && item.paymentMethod === 'cash' && item.paymentStatus === 'pending' && (
                        <button className="action-btn verify" onClick={() => { setSelectedItem(item); setShowVerifyModal(true); }} title="Verify Cash"><FaMoneyBillWave /></button>
                      )}

                      {activeTab === 'pre-assessments' && item.paymentMethod === 'gcash' && item.paymentStatus === 'for_verification' && !item.paymentGateway && (
                        <button className="action-btn verify" onClick={() => { setSelectedItem(item); setShowVerifyModal(true); }} title="Verify GCash"><FaCheckCircle /></button>
                      )}

                      {activeTab === 'pre-assessments' && item.paymentStatus === 'paid' && item.assessmentStatus === 'scheduled' && !item.assignedEngineerId && (
                        <button className="action-btn assign" onClick={() => { setSelectedItem(item); setShowAssignEngineerModal(true); }} title="Assign Engineer"><FaUserCog /></button>
                      )}

                      {activeTab === 'pre-assessments' && item.paymentStatus === 'paid' && item.assignedEngineerId && !hasDeviceAssigned(item) && (
                        <button className="action-btn device" onClick={() => { setSelectedItem(item); setShowAssignDeviceModal(true); }} title="Assign Device"><FaMicrochip /></button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="pagination">
            <button className="page-btn" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1}><FaChevronLeft /> Previous</button>
            <span className="page-info">Page {currentPage} of {totalPages}</span>
            <button className="page-btn" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages}>Next <FaChevronRight /></button>
          </div>
        )}

        {/* Approve Modal */}
        {showApproveModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowApproveModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Approve Booking</h3><button className="modal-close" onClick={() => setShowApproveModal(false)}>×</button></div>
              <div className="modal-body">
                <div className="detail-row"><span>Reference:</span><strong>{selectedItem.bookingReference}</strong></div>
                <div className="detail-row"><span>Client:</span><strong>{selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</strong></div>
                <div className="detail-row"><span>Fee:</span><strong>{formatCurrency(selectedItem.assessmentFee)}</strong></div>
                <div className="form-group"><label>Notes (Optional)</label><textarea rows="3" value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} /></div>
                <div className="info-box"><FaInfoCircle /><small>Approving will generate an invoice for the customer.</small></div>
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowApproveModal(false)}>Cancel</button>
                <button className="reject-btn" onClick={() => handleApproveBooking(false)}>Reject</button>
                <button className="approve-btn" onClick={() => handleApproveBooking(true)} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Approve'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Detail Modal */}
        {showDetailModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
            <div className="modal detail-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Details</h3><button className="modal-close" onClick={() => setShowDetailModal(false)}>×</button></div>
              <div className="modal-body">
                <div className="detail-section">
                  <h4>Client</h4>
                  <p><strong>Name:</strong> {selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</p>
                  <p><strong>Email:</strong> {selectedItem.clientId?.userId?.email}</p>
                  <p><strong>Contact:</strong> {selectedItem.clientId?.contactNumber}</p>
                  <p><strong>Address:</strong> {selectedItem.addressId?.houseOrBuilding} {selectedItem.addressId?.street}, {selectedItem.addressId?.barangay}</p>
                </div>
                {activeTab === 'free-quotes' ? (
                  <div className="detail-section">
                    <h4>Quote Details</h4>
                    <p><strong>Reference:</strong> {selectedItem.quotationReference}</p>
                    <p><strong>Monthly Bill:</strong> {formatCurrency(selectedItem.monthlyBill)}</p>
                    <p><strong>Status:</strong> {selectedItem.status}</p>
                    <p><strong>Engineer:</strong> {getEngineerName(selectedItem.assignedEngineerId)}</p>
                  </div>
                ) : (
                  <div className="detail-section">
                    <h4>Assessment</h4>
                    <p><strong>Reference:</strong> {selectedItem.bookingReference}</p>
                    <p><strong>Fee:</strong> {formatCurrency(selectedItem.assessmentFee)}</p>
                    <p><strong>Payment:</strong> {selectedItem.paymentStatus}</p>
                    <p><strong>Assessment:</strong> {selectedItem.assessmentStatus}</p>
                    <p><strong>Engineer:</strong> {getEngineerName(selectedItem.assignedEngineerId)}</p>

                    <p><strong>Device:</strong> {getDeviceId(selectedItem.assignedDeviceId || selectedItem.iotDeviceId)}</p>
                  </div>
                )}
              </div>
              <div className="modal-actions"><button className="cancel-btn" onClick={() => setShowDetailModal(false)}>Close</button></div>
            </div>
          </div>
        )}

        {/* Verify Modal */}
        {showVerifyModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowVerifyModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Verify Payment</h3><button className="modal-close" onClick={() => setShowVerifyModal(false)}>×</button></div>
              <div className="modal-body">
                <div className="detail-row"><span>Reference:</span><strong>{selectedItem.bookingReference}</strong></div>
                <div className="detail-row"><span>Amount:</span><strong>{formatCurrency(selectedItem.assessmentFee)}</strong></div>
                <div className="detail-row"><span>Method:</span><strong>{selectedItem.paymentMethod?.toUpperCase()}</strong></div>
                {selectedItem.paymentReference && <div className="detail-row"><span>Transaction:</span><strong>{selectedItem.paymentReference}</strong></div>}
                {selectedItem.paymentMethod === 'cash' && (
                  <>
                    <div className="form-group"><label>Notes</label><textarea rows="3" value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} /></div>
                    <div className="modal-actions">
                      <button className="cancel-btn" onClick={() => setShowVerifyModal(false)}>Cancel</button>
                      <button className="verify-btn" onClick={() => handleVerifyPayment(true)}><FaCheckCircle /> Confirm Cash Received</button>
                    </div>
                  </>
                )}
                {selectedItem.paymentGateway === 'paymongo' && (
                  <div className="info-box"><FaInfoCircle /><small>Auto-verified via PayMongo. No action needed.</small></div>
                )}
              </div>
              {selectedItem.paymentGateway === 'paymongo' && (
                <div className="modal-actions"><button className="cancel-btn" onClick={() => setShowVerifyModal(false)}>Close</button></div>
              )}
            </div>
          </div>
        )}

        {/* Assign Engineer Modal */}
        {showAssignEngineerModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowAssignEngineerModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Assign Engineer</h3><button className="modal-close" onClick={() => setShowAssignEngineerModal(false)}>×</button></div>
              <div className="modal-body">
                <div className="detail-row"><span>Reference:</span><strong>{activeTab === 'free-quotes' ? selectedItem.quotationReference : selectedItem.bookingReference}</strong></div>
                <div className="detail-row"><span>Client:</span><strong>{selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</strong></div>
                <div className="form-group"><label>Select Engineer</label><select value={engineerId} onChange={(e) => setEngineerId(e.target.value)}><option value="">Select...</option>{engineers.map(eng => <option key={eng._id} value={eng._id}>{eng.fullName} ({eng.email})</option>)}</select></div>
                {activeTab !== 'free-quotes' && <div className="form-group"><label>Site Visit Date</label><input type="date" value={siteVisitDate} onChange={(e) => setSiteVisitDate(e.target.value)} /></div>}
                <div className="form-group"><label>Notes</label><textarea rows="3" value={siteVisitNotes} onChange={(e) => setSiteVisitNotes(e.target.value)} /></div>
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowAssignEngineerModal(false)}>Cancel</button>
                <button className="assign-btn" onClick={handleAssignEngineer} disabled={!engineerId || isSubmitting}>{isSubmitting ? 'Assigning...' : 'Assign'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Assign Device Modal */}
        {showAssignDeviceModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowAssignDeviceModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Assign Device</h3><button className="modal-close" onClick={() => setShowAssignDeviceModal(false)}>×</button></div>
              <div className="modal-body">
                <div className="detail-row"><span>Assessment:</span><strong>{selectedItem.bookingReference}</strong></div>
                <div className="detail-row"><span>Client:</span><strong>{selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</strong></div>
                <div className="detail-row"><span>Engineer:</span><strong>{getEngineerName(selectedItem.assignedEngineerId)}</strong></div>
                <div className="form-group"><label>Select Device</label><select value={deviceId} onChange={(e) => setDeviceId(e.target.value)}><option value="">Select...</option>{devices.map(device => <option key={device._id} value={device._id}>{device.deviceId} - {device.deviceName}</option>)}</select></div>
                <div className="info-box"><FaWifi /><small>The device will be deployed on site during the site visit.</small></div>
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowAssignDeviceModal(false)}>Cancel</button>
                <button className="assign-btn" onClick={handleAssignDevice} disabled={!deviceId || isSubmitting}>{isSubmitting ? 'Assigning...' : 'Assign'}</button>
              </div>
            </div>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && selectedItem && (
          <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header"><h3>Upload Quotation</h3><button className="modal-close" onClick={() => setShowUploadModal(false)}>×</button></div>
              <div className="modal-body">
                <div className="detail-row"><span>Reference:</span><strong>{selectedItem.quotationReference}</strong></div>
                <div className="detail-row"><span>Client:</span><strong>{selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</strong></div>
                <div className="form-group"><label>Quotation (PDF)</label><input type="file" accept=".pdf" onChange={(e) => setQuotationFile(e.target.files[0])} /></div>
              </div>
              <div className="modal-actions">
                <button className="cancel-btn" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button className="upload-btn" onClick={handleUploadQuotation} disabled={!quotationFile || uploading}>{uploading ? 'Uploading...' : 'Upload'}</button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default SiteAssessment;