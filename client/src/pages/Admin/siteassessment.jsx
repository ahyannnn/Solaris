// src/pages/Admin/SiteAssessment.jsx - Updated with Shared Assignment Modal
import React, { useState, useEffect, useRef } from 'react';
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
  FaWifi,
  FaChevronDown,
  FaUpload,
  FaSyncAlt,
  FaArrowLeft
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/siteassessment.css';

// Recharts Imports
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

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
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignmentStep, setAssignmentStep] = useState('engineer'); // 'engineer' or 'iot'
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState('');
  const [verificationNote, setVerificationNote] = useState('');
  const [selectedEngineerId, setSelectedEngineerId] = useState('');
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [siteVisitDate, setSiteVisitDate] = useState('');
  const [siteVisitNotes, setSiteVisitNotes] = useState('');
  const [quotationFile, setQuotationFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [engineers, setEngineers] = useState([]);
  const [devices, setDevices] = useState([]);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, right: 20 });
  const buttonRefs = useRef({});
  const dropdownRef = useRef(null);
  const [stats, setStats] = useState({
    freeQuotes: { total: 0, pending: 0, assigned: 0, processing: 0, completed: 0 },
    preAssessments: { total: 0, pendingReview: 0, pendingPayment: 0, forVerification: 0, paid: 0, scheduled: 0, completed: 0, autoVerified: 0 }
  });

  // --- CHART DATA ---
  const [chartData, setChartData] = useState([
    { name: 'Jan', quotes: 0, assessments: 0 },
    { name: 'Feb', quotes: 0, assessments: 0 },
    { name: 'Mar', quotes: 0, assessments: 0 },
    { name: 'Apr', quotes: 0, assessments: 0 },
    { name: 'May', quotes: 0, assessments: 0 },
    { name: 'Jun', quotes: 0, assessments: 0 },
    { name: 'Jul', quotes: 0, assessments: 0 },
    { name: 'Aug', quotes: 0, assessments: 0 },
    { name: 'Sep', quotes: 0, assessments: 0 },
    { name: 'Oct', quotes: 0, assessments: 0 },
    { name: 'Nov', quotes: 0, assessments: 0 },
    { name: 'Dec', quotes: 0, assessments: 0 }
  ]);

  useEffect(() => {
    fetchData();
    fetchEngineers();
    fetchDevices();
    fetchStats();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };

    const handleScroll = () => {
      setOpenDropdownId(null);
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScroll, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeTab, filter, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');

      if (activeTab === 'free-quotes') {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: filter === 'all' ? undefined : filter, page: currentPage, limit: itemsPerPage }
        });
        setFreeQuotes(response.data.quotes || []);
        setTotalItems(response.data.total || 0);
      } else {
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { status: filter === 'all' ? undefined : filter, page: currentPage, limit: itemsPerPage }
        });
        setPreAssessments(response.data.assessments || []);
        setTotalItems(response.data.total || 0);
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

      // Process chart data
      const monthlyQuotes = new Array(12).fill(0);
      const monthlyAssessments = new Array(12).fill(0);

      quotes.forEach(quote => {
        if (quote.requestedAt) {
          const month = new Date(quote.requestedAt).getMonth();
          monthlyQuotes[month]++;
        }
      });

      assessments.forEach(assessment => {
        if (assessment.bookedAt) {
          const month = new Date(assessment.bookedAt).getMonth();
          monthlyAssessments[month]++;
        }
      });

      setChartData(chartData.map((item, index) => ({
        ...item,
        quotes: monthlyQuotes[index],
        assessments: monthlyAssessments[index]
      })));

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
      setOpenDropdownId(null);
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
      setOpenDropdownId(null);
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
      setOpenDropdownId(null);
      fetchData();
      fetchStats();
    } catch (error) {
      console.error('Error verifying payment:', error);
      showToast('Failed to verify payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const validateSiteVisitDate = (date) => {
    if (!date) {
      return { valid: false, message: 'Site visit date is required' };
    }

    const selectedDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      return { valid: false, message: 'Site visit date cannot be in the past' };
    }

    return { valid: true, message: '' };
  };

  // --- NEW: Handle opening the shared assignment modal ---
  const handleOpenAssignModal = (item) => {
    setSelectedItem(item);
    setSelectedEngineerId('');
    setSelectedDeviceId('');
    setSiteVisitDate('');
    setSiteVisitNotes('');
    setAssignmentStep('engineer');
    setShowAssignModal(true);
    setOpenDropdownId(null);
  };

  // --- NEW: Handle moving from engineer step to IoT step ---
  const handleProceedToIoT = () => {
    if (!selectedEngineerId) {
      showToast('Please select an engineer first', 'warning');
      return;
    }

    if (!selectedItem || activeTab !== 'free-quotes') {
      const validation = validateSiteVisitDate(siteVisitDate);
      if (!validation.valid) {
        showToast(validation.message, 'warning');
        return;
      }
    }

    setAssignmentStep('iot');
  };

  // --- NEW: Handle going back to engineer step ---
  const handleBackToEngineer = () => {
    setAssignmentStep('engineer');
  };

  // --- MODIFIED: Handle final assignment submission ---
  const handleFinalAssign = async () => {
    if (!selectedItem) return;
    
    // Validate engineer
    if (!selectedEngineerId) {
      showToast('Please select an engineer', 'warning');
      return;
    }

    // Validate device
    if (!selectedDeviceId) {
      showToast('Please select an IoT device', 'warning');
      return;
    }

    // Validate site visit date for pre-assessments
    if (activeTab !== 'free-quotes') {
      const validation = validateSiteVisitDate(siteVisitDate);
      if (!validation.valid) {
        showToast(validation.message, 'warning');
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      
      if (activeTab === 'free-quotes') {
        // For free quotes, only assign engineer
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/free-quotes/${selectedItem._id}/assign-engineer`,
          { engineerId: selectedEngineerId, notes: siteVisitNotes },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        showToast('Engineer assigned to free quote successfully', 'success');
      } else {
        // For pre-assessments, assign both engineer and device
        // Step 1: Assign engineer
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/pre-assessments/${selectedItem._id}/assign-engineer`,
          { engineerId: selectedEngineerId, siteVisitDate, notes: siteVisitNotes },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        // Step 2: Create schedule if site visit date is set
        if (siteVisitDate) {
          await axios.post(
            `${import.meta.env.VITE_API_URL}/api/schedules/create-from-preassessment`,
            { preAssessmentId: selectedItem._id, engineerId: selectedEngineerId, siteVisitDate, siteVisitTime: '09:00' },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        // Step 3: Assign device
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/admin/devices/${selectedDeviceId}/assign`,
          { 
            engineerId: selectedEngineerId, 
            preAssessmentId: selectedItem._id, 
            notes: `Assigned to pre-assessment ${selectedItem.bookingReference}` 
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        showToast('Engineer and IoT device assigned successfully', 'success');
      }

      // Close modal and reset state
      setShowAssignModal(false);
      setSelectedItem(null);
      setSelectedEngineerId('');
      setSelectedDeviceId('');
      setSiteVisitDate('');
      setSiteVisitNotes('');
      setAssignmentStep('engineer');
      setOpenDropdownId(null);
      fetchData();
      fetchStats();
      fetchDevices();
    } catch (error) {
      console.error('Error in assignment:', error);
      showToast(error.response?.data?.message || 'Failed to complete assignment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDropdownClick = (event, itemId) => {
    event.stopPropagation();
    const buttonRect = event.currentTarget.getBoundingClientRect();
    setDropdownPosition({
      top: buttonRect.bottom + 5,
      right: window.innerWidth - buttonRect.right - 10,
    });
    setOpenDropdownId(openDropdownId === itemId ? null : itemId);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatStatusText = (status) => {
    if (!status) return '';
    return status.replace(/_/g, ' ').toUpperCase();
  };

  const getStatusBadge = (status, type) => {
    const statusMap = {
      pending: 'pending',
      assigned: 'assigned',
      processing: 'processing',
      completed: 'completed',
      cancelled: 'cancelled',
      pending_review: 'pending-review',
      pending_payment: 'pending-payment',
      for_verification: 'for-verification',
      paid: 'paid',
      scheduled: 'scheduled',
      site_visit_ongoing: 'site-visit-ongoing',
      accepted: 'accepted',
      quoted: 'quoted',
      verifying: 'verifying',
      'in-progress': 'inprogress',
      approved: 'approved',
      overdue: 'overdue',
      partial: 'partial'
    };

    const mappedStatus = statusMap[status] || 'pending';
    const formattedStatus = formatStatusText(status);
    return <span className={`status-badge-adminbills_ ${mappedStatus}`}>{formattedStatus}</span>;
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
    if (typeof engineer === 'object') {
      if (engineer.fullName) return engineer.fullName;
      if (engineer.name) return engineer.name;
      if (engineer.firstName && engineer.lastName) return `${engineer.firstName} ${engineer.lastName}`;
      if (engineer._id) {
        const foundEngineer = engineers.find(eng => eng._id === engineer._id);
        if (foundEngineer) {
          return foundEngineer.fullName || foundEngineer.name ||
            `${foundEngineer.firstName || ''} ${foundEngineer.lastName || ''}`.trim() ||
            foundEngineer.email || 'Engineer assigned';
        }
      }
      if (engineer.email) {
        const emailName = engineer.email.split('@')[0];
        const formattedName = emailName.replace(/[._-]/g, ' ').split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
        return formattedName || 'Engineer assigned';
      }
      return 'Engineer assigned';
    }
    if (typeof engineer === 'string') {
      const foundEngineer = engineers.find(eng => eng._id === engineer || eng.id === engineer);
      if (foundEngineer) {
        return foundEngineer.fullName || foundEngineer.name ||
          `${foundEngineer.firstName || ''} ${foundEngineer.lastName || ''}`.trim() ||
          foundEngineer.email || 'Engineer assigned';
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

  const getAvailableActions = (item) => {
    const actions = [
      {
        label: 'View Details',
        icon: <FaEye />,
        action: () => { setSelectedItem(item); setShowDetailModal(true); setOpenDropdownId(null); }
      }
    ];

    if (activeTab === 'pre-assessments') {
      if (item.assessmentStatus === 'pending_review') {
        actions.push(
          { label: 'Approve Booking', icon: <FaCheckCircle />, action: () => { setSelectedItem(item); setShowApproveModal(true); setOpenDropdownId(null); }, color: 'success' },
          { label: 'Reject Booking', icon: <FaTimesCircle />, action: () => handleApproveBooking(false), color: 'danger' }
        );
      }
      if (item.paymentMethod === 'cash' && item.paymentStatus === 'pending') {
        actions.push(
          { label: 'Verify Cash Payment', icon: <FaMoneyBillWave />, action: () => { setSelectedItem(item); setShowVerifyModal(true); setOpenDropdownId(null); }, color: 'warning' }
        );
      }
      if (item.paymentMethod === 'gcash' && item.paymentStatus === 'for_verification' && !item.paymentGateway) {
        actions.push(
          { label: 'Verify GCash Payment', icon: <FaCheckCircle />, action: () => { setSelectedItem(item); setShowVerifyModal(true); setOpenDropdownId(null); }, color: 'success' }
        );
      }
      if (item.paymentStatus === 'paid' && item.assessmentStatus === 'scheduled' && !item.assignedEngineerId) {
        actions.push(
          { label: 'Assign Engineer & Device', icon: <FaUserCog />, action: () => handleOpenAssignModal(item), color: 'primary' }
        );
      }
      if ((item.paymentGateway === 'paymongo' || item.autoVerified === true) && item.paymentStatus === 'paid') {
        actions.push(
          { label: 'Auto-Verified', icon: <FaCheckCircle />, action: null, color: 'success', disabled: true }
        );
      }
    } else {
      if (item.status === 'pending') {
        actions.push(
          { label: 'Assign Engineer', icon: <FaUserCog />, action: () => { setSelectedItem(item); setShowAssignEngineerModal(true); setOpenDropdownId(null); }, color: 'primary' }
        );
      }
      if (item.status === 'assigned') {
        actions.push(
          { label: 'Mark as Processing', icon: <FaTools />, action: () => handleUpdateStatus(item._id, 'processing'), color: 'warning' }
        );
      }
      if (item.status === 'processing') {
        actions.push(
          { label: 'Upload Quotation', icon: <FaUpload />, action: () => { setSelectedItem(item); setShowUploadModal(true); setOpenDropdownId(null); }, color: 'primary' },
          { label: 'Mark as Completed', icon: <FaCheckCircle />, action: () => handleUpdateStatus(item._id, 'completed'), color: 'success' }
        );
      }
    }

    return actions;
  };

  const SkeletonLoader = () => (
    <div className="site-assessment-adminbills_">
      <div className="header-adminbills_">
        <div className="skeleton-title-adminbills_ skeleton-line-adminbills_"></div>
        <div className="skeleton-subtitle-adminbills_ skeleton-line-adminbills_"></div>
      </div>
      <div className="chart-area-adminbills_ skeleton-chart-adminbills_"></div>
      <div className="tabs-adminbills_">
        <div className="skeleton-tab-adminbills_ skeleton-line-adminbills_"></div>
        <div className="skeleton-tab-adminbills_ skeleton-line-adminbills_"></div>
      </div>
      <div className="skeleton-table-adminbills_ skeleton-line-adminbills_"></div>
    </div>
  );

  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

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

  if (loading && (activeTab === 'free-quotes' ? freeQuotes.length === 0 : preAssessments.length === 0)) {
    return <SkeletonLoader />;
  }

  /* --- Recharts Custom Tooltip - Uses CSS variables for theming --- */
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="recharts-custom-tooltip-adminbills_">
          <p className="tooltip-label-adminbills_">{label}</p>
          {payload.map((entry, idx) => (
            <p key={idx} className="tooltip-item-adminbills_">
              {entry.name}: {entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const getTodayDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  return (
    <>
      <Helmet><title>Site Assessment | Admin | Salfer Engineering</title></Helmet>

      <div className="site-assessment-adminbills_">
        {/* --- Analytics Chart (Placed 1st) --- */}
        <div className="chart-area-adminbills_">
          <div className="chart-header-adminbills_">
            <h3>Monthly Volume</h3>
            <span className="chart-period-adminbills_">Free Quotes vs Pre-Assessments</span>
          </div>
          <div className="chart-wrapper-adminbills_">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 5, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorQuotes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F39C12" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#F39C12" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAssessments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={true} stroke="var(--border-color, #EEF0ED)" />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary, #17212B)', fontSize: 12, fontWeight: 500 }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: 'var(--text-secondary, #17212B)', fontSize: 12, fontWeight: 500 }}
                  width={40}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'var(--border-color, #D1D5DB)', strokeWidth: 1 }} />
                <Area
                  type="monotone"
                  dataKey="quotes"
                  name="Free Quotes"
                  stroke="#F39C12"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorQuotes)"
                  dot={{ r: 4, fill: '#F39C12', strokeWidth: 2, stroke: 'var(--bg-card, #FFFFFF)' }}
                  activeDot={{ r: 6 }}
                />
                <Area
                  type="monotone"
                  dataKey="assessments"
                  name="Pre-Assessments"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorAssessments)"
                  dot={{ r: 4, fill: '#10B981', strokeWidth: 2, stroke: 'var(--bg-card, #FFFFFF)' }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- Tab Bar (Placed 2nd below chart) --- */}
        <div className="tabs-adminbills_">
          <button
            className={`tab-btn-adminbills_ ${activeTab === 'free-quotes' ? 'active-adminbills_' : ''}`}
            onClick={() => { setActiveTab('free-quotes'); setFilter('all'); setCurrentPage(1); }}
          >
            Free Quotes
            <span className="tab-badge-adminbills_">{stats.freeQuotes.total}</span>
          </button>
          <button
            className={`tab-btn-adminbills_ ${activeTab === 'pre-assessments' ? 'active-adminbills_' : ''}`}
            onClick={() => { setActiveTab('pre-assessments'); setFilter('all'); setCurrentPage(1); }}
          >
            Pre-Assessments
            <span className="tab-badge-adminbills_">{stats.preAssessments.total}</span>
          </button>
        </div>

        {/* --- Toolbar --- */}
        <div className="toolbar-adminbills_">
          <div className="search-group-adminbills_">
            <FaSearch className="search-icon-adminbills_" />
            <input
              type="text"
              placeholder="Search by client name or reference..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-group-adminbills_">
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
            <FaChevronDown className="select-arrow-adminbills_" />
          </div>
          <button className="refresh-btn-adminbills_" onClick={() => { fetchData(); fetchStats(); }}>
            <FaSyncAlt className={loading ? 'spinning-adminbills_' : ''} /> Refresh
          </button>
        </div>

        {/* --- TABLE --- */}
        <div className="billing-customer-table-container">
          <div className="table-responsive-adminbills_">
            <table className="data-table-adminbills_">
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Client</th>
                  <th>Contact</th>
                  <th>Date</th>
                  {activeTab === 'free-quotes' ? <th>Monthly Bill</th> : <th>Property</th>}
                  {activeTab === 'pre-assessments' && <th>Amount</th>}
                  <th>Status</th>
                  <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredItems.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="empty-state-adminbills_">
                      No {activeTab === 'free-quotes' ? 'free quotes' : 'pre-assessments'} found
                    </td>
                  </tr>
                ) : (
                  filteredItems.map(item => {
                    const actions = getAvailableActions(item);
                    const isOpen = openDropdownId === item._id;

                    return (
                      <tr key={item._id}>
                        <td data-label="Reference" className="ref-cell-adminbills_">
                          {activeTab === 'free-quotes' ? item.quotationReference : item.bookingReference}
                        </td>
                        <td data-label="Client" className="client-cell-adminbills_">
                          {item.clientId?.contactFirstName} {item.clientId?.contactLastName}
                        </td>
                        <td data-label="Contact">
                          <div className="contact-info-adminbills_">{item.clientId?.contactNumber || 'N/A'}</div>
                          <div className="email-cell-adminbills_">{item.clientId?.userId?.email || 'N/A'}</div>
                        </td>
                        <td data-label="Date">
                          {formatDate(activeTab === 'free-quotes' ? item.requestedAt : item.bookedAt)}
                        </td>
                        {activeTab === 'free-quotes' ? (
                          <td data-label="Monthly Bill" className="amount-cell-adminbills_">
                            {formatCurrency(item.monthlyBill)}
                          </td>
                        ) : (
                          <>
                            <td data-label="Property">{item.propertyType}</td>
                            <td data-label="Amount" className="amount-cell-adminbills_">
                              {formatCurrency(item.assessmentFee)}
                            </td>
                          </>
                        )}
                        <td data-label="Status">
                          {getStatusBadge(getDisplayStatus(item), activeTab === 'free-quotes' ? 'free-quote' : 'pre-assessment')}
                        </td>
                        <td data-label="Actions" style={{ textAlign: 'center', position: 'relative' }}>
                          <div className="action-dropdown-container-adminbills_">
                            <button
                              className="action-dropdown-toggle-adminbills_"
                              ref={el => buttonRefs.current[item._id] = el}
                              onClick={(e) => handleDropdownClick(e, item._id)}
                            >
                              Action <FaChevronDown className={`dropdown-arrow-adminbills_ ${isOpen ? 'open-adminbills_' : ''}`} />
                            </button>

                            {isOpen && (
                              <div
                                className="action-dropdown-menu-adminbills_"
                                ref={dropdownRef}
                                style={{
                                  position: 'fixed',
                                  top: dropdownPosition.top,
                                  right: dropdownPosition.right,
                                  zIndex: 9999,
                                }}
                              >
                                {actions.map((action, idx) => (
                                  action.disabled ? (
                                    <div key={idx} className={`dropdown-item-adminbills_ disabled-adminbills_ ${action.color || ''}`}>
                                      {action.icon} <span>{action.label}</span>
                                    </div>
                                  ) : (
                                    <button
                                      key={idx}
                                      className={`dropdown-item-adminbills_ ${action.color || ''}`}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        action.action();
                                      }}
                                    >
                                      {action.icon} <span>{action.label}</span>
                                    </button>
                                  )
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* --- Pagination --- */}
        {totalPages > 1 && (
          <div className="pagination-adminbills_">
            <div className="pagination-info-adminbills_">
              Showing {startItem} to {endItem} of {totalItems} entries
            </div>
            <div className="pagination-controls-adminbills_">
              <button
                className="page-btn-adminbills_"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <FaChevronLeft /> Previous
              </button>

              {getPageNumbers().map(page => (
                <button
                  key={page}
                  className={`page-number-adminbills_ ${currentPage === page ? 'active-adminbills_' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="page-btn-adminbills_"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next <FaChevronRight />
              </button>
            </div>
          </div>
        )}

        {/* --- SHARED ASSIGNMENT MODAL (Two Steps) --- */}
        {showAssignModal && selectedItem && (
          <div className="modal-overlay-adminbills_" onClick={() => setShowAssignModal(false)}>
            <div className="modal-adminbills_ assign-engineer-modal-adminbills_" onClick={e => e.stopPropagation()}>
              <div className="modal-header-adminbills_">
                <h3>
                  {assignmentStep === 'engineer' ? 'Assign Engineer' : 'Assign IoT Device'}
                </h3>
                <button className="modal-close-adminbills_" onClick={() => {
                  setShowAssignModal(false);
                  setSelectedEngineerId('');
                  setSelectedDeviceId('');
                  setAssignmentStep('engineer');
                }}>×</button>
              </div>
              <div className="modal-body-adminbills_">
                <div className="detail-row-adminbills_">
                  <span>Reference:</span>
                  <strong>{activeTab === 'free-quotes' ? selectedItem.quotationReference : selectedItem.bookingReference}</strong>
                </div>
                <div className="detail-row-adminbills_">
                  <span>Client:</span>
                  <strong>{selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</strong>
                </div>

                {/* --- STEP 1: Engineer Selection --- */}
                {assignmentStep === 'engineer' && (
                  <>
                    <div className="form-group-adminbills_">
                      <label>Select Engineer <span className="required-field-adminbills_">*</span></label>
                      <div className="engineer-grid-adminbills_">
                        {engineers.length === 0 ? (
                          <div className="no-engineers-adminbills_">No engineers available</div>
                        ) : (
                          engineers.map(eng => (
                            <div
                              key={eng._id}
                              className={`engineer-card-adminbills_ ${selectedEngineerId === eng._id ? 'selected-adminbills_' : ''}`}
                              onClick={() => setSelectedEngineerId(eng._id)}
                            >
                              <div className="engineer-avatar-adminbills_">
                                <span>{eng.fullName?.charAt(0) || 'E'}</span>
                              </div>
                              <div className="engineer-info-adminbills_">
                                <div className="engineer-name-adminbills_">{eng.fullName || 'Engineer'}</div>
                                <div className="engineer-email-adminbills_">{eng.email}</div>
                              </div>
                              {selectedEngineerId === eng._id && (
                                <div className="engineer-selected-badge-adminbills_"><FaCheckCircle /></div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {activeTab !== 'free-quotes' && (
                      <div className="form-group-adminbills_">
                        <label>
                          Site Visit Date <span className="required-field-adminbills_">*</span>
                        </label>
                        <input
                          type="date"
                          className={`date-input-adminbills_ ${siteVisitDate && new Date(siteVisitDate) < new Date(new Date().setHours(0, 0, 0, 0)) ? 'invalid-date-adminbills_' : ''}`}
                          value={siteVisitDate}
                          onChange={(e) => setSiteVisitDate(e.target.value)}
                          min={getTodayDate()}
                          required
                        />
                        {siteVisitDate && new Date(siteVisitDate) < new Date(new Date().setHours(0, 0, 0, 0)) && (
                          <div className="validation-error-adminbills_">
                            <label>Site visit date cannot be in the past</label>
                          </div>
                        )}
                        {!siteVisitDate && (
                          <div className="validation-hint-adminbills_">
                            <label>Please select a future date for the site visit</label>
                          </div>
                        )}
                      </div>
                    )}

                    <div className="form-group-adminbills_">
                      <label>Notes</label>
                      <textarea
                        rows="3"
                        value={siteVisitNotes}
                        onChange={(e) => setSiteVisitNotes(e.target.value)}
                        placeholder="Add any special instructions or notes..."
                      />
                    </div>

                    {/* Show selected engineer summary */}
                    {selectedEngineerId && (
                      <div className="info-box-adminbills_">
                        <FaCheckCircle />
                        <small>
                          Selected: <strong>{engineers.find(e => e._id === selectedEngineerId)?.fullName || 'Engineer'}</strong>
                          {activeTab !== 'free-quotes' && siteVisitDate && ` • Site Visit: ${formatDate(siteVisitDate)}`}
                        </small>
                      </div>
                    )}
                  </>
                )}

                {/* --- STEP 2: IoT Device Selection --- */}
                {assignmentStep === 'iot' && (
                  <>
                    {/* Show selected engineer summary */}
                    <div className="info-box-adminbills_" style={{ marginBottom: '16px' }}>
                      <FaCheckCircle />
                      <small>
                        Engineer: <strong>{engineers.find(e => e._id === selectedEngineerId)?.fullName || 'Engineer'}</strong>
                        {activeTab !== 'free-quotes' && siteVisitDate && ` • Site Visit: ${formatDate(siteVisitDate)}`}
                      </small>
                    </div>

                    <div className="form-group-adminbills_">
                      <label>Select IoT Device <span className="required-field-adminbills_">*</span></label>
                      <div className="device-grid-adminbills_">
                        {devices.length === 0 ? (
                          <div className="no-devices-adminbills_">No available IoT devices</div>
                        ) : (
                          devices.map(device => (
                            <div
                              key={device._id}
                              className={`device-card-adminbills_ ${selectedDeviceId === device._id ? 'selected-adminbills_' : ''}`}
                              onClick={() => setSelectedDeviceId(device._id)}
                            >
                              <div className="device-icon-adminbills_">
                                <FaMicrochip />
                              </div>
                              <div className="device-info-adminbills_">
                                <div className="device-name-adminbills_">{device.deviceName || 'IoT Device'}</div>
                                <div className="device-id-adminbills_">ID: {device.deviceId}</div>
                                <div className="device-status-adminbills_">
                                  <span className="device-available-badge">Available</span>
                                </div>
                              </div>
                              {selectedDeviceId === device._id && (
                                <div className="device-selected-badge-adminbills_"><FaCheckCircle /></div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Show selected device summary */}
                    {selectedDeviceId && (
                      <div className="info-box-adminbills_">
                        <FaCheckCircle />
                        <small>
                          Selected Device: <strong>{devices.find(d => d._id === selectedDeviceId)?.deviceName || 'Device'}</strong>
                          {' '}({devices.find(d => d._id === selectedDeviceId)?.deviceId || 'N/A'})
                        </small>
                      </div>
                    )}
                  </>
                )}
              </div>
              <div className="modal-actions-adminbills_">
                <button 
                  className="cancel-btn-adminbills_" 
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedEngineerId('');
                    setSelectedDeviceId('');
                    setAssignmentStep('engineer');
                  }}
                >
                  Cancel
                </button>
                
                {assignmentStep === 'engineer' && (
                  <>
                    <button
                      className="assign-btn-adminbills_"
                      onClick={handleProceedToIoT}
                      disabled={!selectedEngineerId || isSubmitting || (activeTab !== 'free-quotes' && !siteVisitDate)}
                    >
                      {isSubmitting ? 'Processing...' : 'Assign Engineer'}
                    </button>
                  </>
                )}

                {assignmentStep === 'iot' && (
                  <>
                  
                    <button
                      className="assign-btn-adminbills_"
                      onClick={handleFinalAssign}
                      disabled={!selectedDeviceId || isSubmitting}
                    >
                      {isSubmitting ? 'Assigning...' : 'Assign IoT Device'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* --- OTHER MODALS --- */}
        {showApproveModal && selectedItem && (
          <div className="modal-overlay-adminbills_" onClick={() => setShowApproveModal(false)}>
            <div className="modal-adminbills_" onClick={e => e.stopPropagation()}>
              <div className="modal-header-adminbills_"><h3>Approve Booking</h3><button className="modal-close-adminbills_" onClick={() => setShowApproveModal(false)}>×</button></div>
              <div className="modal-body-adminbills_">
                <div className="detail-row-adminbills_"><span>Reference:</span><strong>{selectedItem.bookingReference}</strong></div>
                <div className="detail-row-adminbills_"><span>Client:</span><strong>{selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</strong></div>
                <div className="detail-row-adminbills_"><span>Fee:</span><strong>{formatCurrency(selectedItem.assessmentFee)}</strong></div>
                <div className="form-group-adminbills_"><label>Notes (Optional)</label><textarea rows="3" value={approveNotes} onChange={(e) => setApproveNotes(e.target.value)} /></div>
                <div className="info-box-adminbills_"><FaInfoCircle /><small>Approving will generate an invoice for the customer.</small></div>
              </div>
              <div className="modal-actions-adminbills_">
                <button className="cancel-btn-adminbills_" onClick={() => setShowApproveModal(false)}>Cancel</button>
                <button className="reject-btn-adminbills_" onClick={() => handleApproveBooking(false)}>Reject</button>
                <button className="approve-btn-adminbills_" onClick={() => handleApproveBooking(true)} disabled={isSubmitting}>{isSubmitting ? 'Processing...' : 'Approve'}</button>
              </div>
            </div>
          </div>
        )}

        {showDetailModal && selectedItem && (
          <div className="modal-overlay-adminbills_" onClick={() => setShowDetailModal(false)}>
            <div className="modal-adminbills_ detail-modal-adminbills_" onClick={e => e.stopPropagation()}>
              <div className="modal-header-adminbills_"><h3>Details</h3><button className="modal-close-adminbills_" onClick={() => setShowDetailModal(false)}>×</button></div>
              <div className="modal-body-adminbills_">
                <div className="detail-section-adminbills_"><h4>Client</h4><p><strong>Name:</strong> {selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</p><p><strong>Email:</strong> {selectedItem.clientId?.userId?.email}</p><p><strong>Contact:</strong> {selectedItem.clientId?.contactNumber}</p><p><strong>Address:</strong> {selectedItem.addressId?.houseOrBuilding} {selectedItem.addressId?.street}, {selectedItem.addressId?.barangay}</p></div>
                {activeTab === 'free-quotes' ? (
                  <div className="detail-section-adminbills_"><h4>Quote Details</h4><p><strong>Reference:</strong> {selectedItem.quotationReference}</p><p><strong>Monthly Bill:</strong> {formatCurrency(selectedItem.monthlyBill)}</p><p><strong>Status:</strong> {selectedItem.status}</p><p><strong>Engineer:</strong> {getEngineerName(selectedItem.assignedEngineerId)}</p></div>
                ) : (
                  <div className="detail-section-adminbills_"><h4>Assessment</h4><p><strong>Reference:</strong> {selectedItem.bookingReference}</p><p><strong>Fee:</strong> {formatCurrency(selectedItem.assessmentFee)}</p><p><strong>Payment:</strong> {selectedItem.paymentStatus}</p><p><strong>Assessment:</strong> {selectedItem.assessmentStatus}</p><p><strong>Engineer:</strong> {getEngineerName(selectedItem.assignedEngineerId)}</p><p><strong>Device:</strong> {getDeviceId(selectedItem.assignedDeviceId || selectedItem.iotDeviceId)}</p></div>
                )}
              </div>
              <div className="modal-actions-adminbills_"><button className="cancel-btn-adminbills_" onClick={() => setShowDetailModal(false)}>Close</button></div>
            </div>
          </div>
        )}

        {showVerifyModal && selectedItem && (
          <div className="modal-overlay-adminbills_" onClick={() => setShowVerifyModal(false)}>
            <div className="modal-adminbills_" onClick={e => e.stopPropagation()}>
              <div className="modal-header-adminbills_"><h3>Verify Payment</h3><button className="modal-close-adminbills_" onClick={() => setShowVerifyModal(false)}>×</button></div>
              <div className="modal-body-adminbills_">
                <div className="detail-row-adminbills_"><span>Reference:</span><strong>{selectedItem.bookingReference}</strong></div>
                <div className="detail-row-adminbills_"><span>Amount:</span><strong>{formatCurrency(selectedItem.assessmentFee)}</strong></div>
                <div className="detail-row-adminbills_"><span>Method:</span><strong>{selectedItem.paymentMethod?.toUpperCase()}</strong></div>
                {selectedItem.paymentReference && <div className="detail-row-adminbills_"><span>Transaction:</span><strong>{selectedItem.paymentReference}</strong></div>}
                {selectedItem.paymentMethod === 'cash' && (
                  <><div className="form-group-adminbills_"><label>Notes</label><textarea rows="3" value={verificationNote} onChange={(e) => setVerificationNote(e.target.value)} /></div><div className="modal-actions-adminbills_"><button className="cancel-btn-adminbills_" onClick={() => setShowVerifyModal(false)}>Cancel</button><button className="verify-btn-adminbills_" onClick={() => handleVerifyPayment(true)}><FaCheckCircle /> Confirm Cash Received</button></div></>
                )}
                {selectedItem.paymentGateway === 'paymongo' && (<div className="info-box-adminbills_"><FaInfoCircle /><small>Auto-verified via PayMongo. No action needed.</small></div>)}
              </div>
              {selectedItem.paymentGateway === 'paymongo' && (<div className="modal-actions-adminbills_"><button className="cancel-btn-adminbills_" onClick={() => setShowVerifyModal(false)}>Close</button></div>)}
            </div>
          </div>
        )}

        {showUploadModal && selectedItem && (
          <div className="modal-overlay-adminbills_" onClick={() => setShowUploadModal(false)}>
            <div className="modal-adminbills_" onClick={e => e.stopPropagation()}>
              <div className="modal-header-adminbills_"><h3>Upload Quotation</h3><button className="modal-close-adminbills_" onClick={() => setShowUploadModal(false)}>×</button></div>
              <div className="modal-body-adminbills_">
                <div className="detail-row-adminbills_"><span>Reference:</span><strong>{selectedItem.quotationReference}</strong></div>
                <div className="detail-row-adminbills_"><span>Client:</span><strong>{selectedItem.clientId?.contactFirstName} {selectedItem.clientId?.contactLastName}</strong></div>
                <div className="form-group-adminbills_"><label>Quotation (PDF)</label><input type="file" accept=".pdf" onChange={(e) => setQuotationFile(e.target.files[0])} /></div>
              </div>
              <div className="modal-actions-adminbills_">
                <button className="cancel-btn-adminbills_" onClick={() => setShowUploadModal(false)}>Cancel</button>
                <button className="upload-btn-adminbills_" onClick={handleUploadQuotation} disabled={!quotationFile || uploading}>
                  {uploading ? 'Uploading...' : 'Upload'}
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

export default SiteAssessment;