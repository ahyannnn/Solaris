// pages/Engineer/MyAssessments.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaUpload,
  FaCheckCircle,
  FaClock,
  FaCamera,
  FaDownload,
  FaEye,
  FaComment,
  FaPaperPlane,
  FaClipboardList,
  FaHardHat,
  FaChartLine,
  FaMicrochip,
  FaImages,
  FaTrash,
  FaPlus,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaArrowLeft,
  FaSave,
  FaFilePdf,
  FaSpinner,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaQuoteRight,
  FaClipboardCheck,
  FaDollarSign,
  FaBoxes,
  FaTools,
  FaWifi,
  FaServer,
  FaRulerCombined,
  FaArrowsAltH,
  FaArrowsAltV,
  FaSolarPanel,
  FaChartArea,
  FaSun,
  FaThermometerHalf,
  FaTint,
  FaChartBar,
  FaBolt,
  FaBatteryFull
} from 'react-icons/fa';
import '../../styles/Engineer/siteassessment.css';
import { useToast, ToastNotification } from '../../assets/toastnotification';

// Debug logger utility
const DEBUG = true; // Set to false to disable debug logs in production
const logger = {
  info: (message, data = null) => {
    if (DEBUG) {
      console.log(`%c[INFO] ${message}`, 'color: #00a8ff', data || '');
    }
  },
  success: (message, data = null) => {
    if (DEBUG) {
      console.log(`%c[SUCCESS] ${message}`, 'color: #4cd964', data || '');
    }
  },
  error: (message, error = null) => {
    if (DEBUG) {
      console.error(`%c[ERROR] ${message}`, 'color: #ff3b30', error);
    }
  },
  warn: (message, data = null) => {
    if (DEBUG) {
      console.warn(`%c[WARN] ${message}`, 'color: #ff9500', data || '');
    }
  },
  api: (method, url, data = null) => {
    if (DEBUG) {
      console.log(`%c[API ${method}] ${url}`, 'color: #5856d6', data || '');
    }
  }
};

const MyAssessments = () => {
  // Log component mount
  logger.info('MyAssessments component mounted');

  const { toast, showToast, hideToast } = useToast();
  const [freeQuotes, setFreeQuotes] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);
  const [allAssessments, setAllAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deployNotes, setDeployNotes] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [includeIoTData, setIncludeIoTData] = useState(true);
  const [analyzingData, setAnalyzingData] = useState(false);
  const [iotAnalysis, setIotAnalysis] = useState(null);
  const [config, setConfig] = useState(null);

  // New Quotation State with Equipment Selection
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [selectedInverter, setSelectedInverter] = useState(null);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [panelQuantity, setPanelQuantity] = useState(1);
  const [inverterQuantity, setInverterQuantity] = useState(1);
  const [batteryQuantity, setBatteryQuantity] = useState(0);
  const [additionalEquipment, setAdditionalEquipment] = useState([]);

  // Available equipment from config
  const [availablePanels, setAvailablePanels] = useState([]);
  const [availableInverters, setAvailableInverters] = useState([]);
  const [availableBatteries, setAvailableBatteries] = useState([]);
  const [availableMountingStructures, setAvailableMountingStructures] = useState([]);
  const [availableElectricalComponents, setAvailableElectricalComponents] = useState([]);
  const [availableCables, setAvailableCables] = useState([]);

  // Cost calculations
  const [calculatedCosts, setCalculatedCosts] = useState({
    panelCost: 0,
    inverterCost: 0,
    batteryCost: 0,
    mountingCost: 0,
    electricalCost: 0,
    cableCost: 0,
    totalEquipmentCost: 0,
    installationLaborCost: 0,
    totalSystemCost: 0
  });

  // Free Quote Form State
  const [freeQuoteForm, setFreeQuoteForm] = useState({
    quotationNumber: '',
    quotationExpiryDate: '',
    systemSize: '',
    systemType: 'grid-tie',
    panelsNeeded: '',
    panelType: '',
    inverterType: '',
    batteryType: '',
    installationCost: 0,
    equipmentCost: 0,
    totalCost: 0,
    paymentTerms: '',
    warrantyYears: 10,
    remarks: '',
    roofLength: '',
    roofWidth: ''
  });

  // Add this helper function inside the component, before the useState declarations
  const generateQuotationNumber = () => {
    const prefix = 'Q';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}${month}-${random}`;
  };

  // Helper to get date 30 days from now
  const getExpiryDate30Days = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };
  
  // Pre-Assessment Form State
  const [assessmentForm, setAssessmentForm] = useState({
    roofCondition: '',
    roofLength: '',
    roofWidth: '',
    structuralIntegrity: '',
    estimatedInstallationTime: '',
    recommendations: '',
    technicalFindings: '',
    siteVisitNotes: ''
  });

  // Quotation Form State
  const [quotationForm, setQuotationForm] = useState({
    quotationNumber: '',
    quotationExpiryDate: '',
    systemSize: '',
    systemType: 'grid-tie',
    panelsNeeded: '',
    panelType: '',
    inverterType: '',
    batteryType: '',
    installationCost: 0,
    equipmentCost: 0,
    totalCost: 0,
    paymentTerms: '',
    warrantyYears: 10
  });

  const [siteImages, setSiteImages] = useState([]);

  // Get API base URL from environment with logging
  const getApiBaseUrl = () => {
    const url = import.meta.env.VITE_API_URL || '';
    logger.info('API Base URL configuration', {
      VITE_API_URL: import.meta.env.VITE_API_URL,
      resolvedUrl: url,
      mode: import.meta.env.MODE,
      isProduction: import.meta.env.PROD
    });
    
    if (!url && import.meta.env.PROD) {
      logger.warn('VITE_API_URL is not set in production! API calls may fail.');
    }
    
    return url;
  };

  const API_BASE_URL = getApiBaseUrl();

  const ASSESSMENT_TYPES = {
    free_quote: {
      label: 'Free Quote',
      color: 'free-quote-enad',
      icon: FaQuoteRight,
      statusKey: 'status'
    },
    pre_assessment: {
      label: 'Pre-Assessment',
      color: 'pre-assessment-enad',
      icon: FaClipboardCheck,
      statusKey: 'assessmentStatus'
    }
  };

  const FREE_QUOTE_STATUS = {
    pending: { label: 'Pending', color: 'pending-enad', icon: FaClock },
    assigned: { label: 'Assigned', color: 'processing-enad', icon: FaUser },
    processing: { label: 'Processing', color: 'processing-enad', icon: FaTools },
    completed: { label: 'Completed', color: 'completed-enad', icon: FaCheckCircle },
    cancelled: { label: 'Cancelled', color: 'cancelled-enad', icon: FaTimes }
  };

  const PRE_ASSESSMENT_STATUS = {
    pending_payment: { label: 'Pending Payment', color: 'pending-enad', icon: FaDollarSign },
    scheduled: { label: 'Scheduled', color: 'scheduled-enad', icon: FaClock },
    site_visit_ongoing: { label: 'Site Visit Ongoing', color: 'site-visit-enad', icon: FaHardHat },
    device_deployed: { label: 'Device Deployed', color: 'device-deployed-enad', icon: FaMicrochip },
    data_collecting: { label: 'Collecting Data', color: 'data-collecting-enad', icon: FaChartLine },
    data_analyzing: { label: 'Analyzing Data', color: 'data-analyzing-enad', icon: FaChartLine },
    report_draft: { label: 'Report Draft', color: 'report-draft-enad', icon: FaFileAlt },
    completed: { label: 'Completed', color: 'completed-enad', icon: FaCheckCircle },
    cancelled: { label: 'Cancelled', color: 'cancelled-enad', icon: FaTimes }
  };

  const ROOF_CONDITIONS = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  const STRUCTURAL_INTEGRITY = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  const SYSTEM_TYPES = [
    { value: 'grid-tie', label: 'Grid-Tie System', description: 'Connected to utility grid, no batteries' },
    { value: 'hybrid', label: 'Hybrid System', description: 'Grid-tie with battery backup' },
    { value: 'off-grid', label: 'Off-Grid System', description: 'Standalone with batteries, not connected to grid' }
  ];

  // Fetch all equipment from system config
  const fetchAllEquipment = async () => {
    logger.info('fetchAllEquipment started');
    try {
      const token = sessionStorage.getItem('token');
      logger.info('Token exists:', { hasToken: !!token, tokenLength: token?.length });

      if (!token) {
        logger.error('No token found in sessionStorage');
        showToast('Authentication token not found. Please login again.', 'error');
        return;
      }

      const endpoints = [
        `${API_BASE_URL}/api/maintenance/config/equipment/solarPanels`,
        `${API_BASE_URL}/api/maintenance/config/equipment/inverters`,
        `${API_BASE_URL}/api/maintenance/config/equipment/batteries`,
        `${API_BASE_URL}/api/maintenance/config/equipment/mountingStructures`,
        `${API_BASE_URL}/api/maintenance/config/equipment/electricalComponents`,
        `${API_BASE_URL}/api/maintenance/config/equipment/cablesAndWiring`
      ];

      logger.info('Fetching equipment from endpoints:', endpoints);

      const [panelsRes, invertersRes, batteriesRes, mountingRes, electricalRes, cablesRes] = await Promise.all([
        axios.get(endpoints[0], { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(endpoints[1], { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(endpoints[2], { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(endpoints[3], { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(endpoints[4], { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(endpoints[5], { headers: { Authorization: `Bearer ${token}` } })
      ]);

      logger.success('Equipment fetched successfully', {
        panels: panelsRes.data.items?.length || 0,
        inverters: invertersRes.data.items?.length || 0,
        batteries: batteriesRes.data.items?.length || 0
      });

      setAvailablePanels(panelsRes.data.items || []);
      setAvailableInverters(invertersRes.data.items || []);
      setAvailableBatteries(batteriesRes.data.items || []);
      setAvailableMountingStructures(mountingRes.data.items || []);
      setAvailableElectricalComponents(electricalRes.data.items || []);
      setAvailableCables(cablesRes.data.items || []);

    } catch (error) {
      logger.error('Error fetching equipment:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config
      });
      showToast('Failed to load equipment data', 'error');
    }
  };

  // Calculate total costs based on selections
  const calculateTotalCosts = () => {
    // Panel cost
    let panelCost = 0;
    if (selectedPanel) {
      if (selectedPanel.unit === 'watt') {
        const systemSizeWatts = (quotationForm.systemSize || 0) * 1000;
        panelCost = selectedPanel.price * systemSizeWatts;
      } else {
        panelCost = selectedPanel.price * panelQuantity;
      }
    }

    // Inverter cost
    let inverterCost = 0;
    if (selectedInverter) {
      inverterCost = selectedInverter.price * inverterQuantity;
    }

    // Battery cost
    let batteryCost = 0;
    if (selectedBattery) {
      batteryCost = selectedBattery.price * batteryQuantity;
    }

    // Mounting structure cost (estimated based on panel quantity)
    let mountingCost = 0;
    if (availableMountingStructures.length > 0) {
      const defaultMount = availableMountingStructures.find(m => m.isActive) || availableMountingStructures[0];
      if (defaultMount) {
        mountingCost = defaultMount.price * Math.ceil(panelQuantity / 4);
      }
    }

    // Electrical components cost
    let electricalCost = 0;
    if (availableElectricalComponents.length > 0) {
      electricalCost = availableElectricalComponents.reduce((sum, item) => sum + (item.price * 2), 0);
    }

    // Cable cost (estimated based on system size)
    let cableCost = 0;
    if (availableCables.length > 0) {
      const cablePerMeter = availableCables[0];
      const cableMeters = (quotationForm.systemSize || 5) * 15;
      cableCost = cablePerMeter.price * cableMeters;
    }

    const totalEquipmentCost = panelCost + inverterCost + batteryCost + mountingCost + electricalCost + cableCost;

    // Installation labor cost
    let installationLaborCost = 0;
    if (config?.laborRates) {
      const systemSize = quotationForm.systemSize || 5;
      installationLaborCost = (systemSize * config.laborRates.perKw) + (panelQuantity * config.laborRates.perPanel);
      installationLaborCost = Math.max(installationLaborCost, config.laborRates.minimumFee || 10000);
    } else {
      installationLaborCost = (quotationForm.systemSize || 5) * 5000;
    }

    const totalSystemCost = totalEquipmentCost + installationLaborCost;

    setCalculatedCosts({
      panelCost,
      inverterCost,
      batteryCost,
      mountingCost,
      electricalCost,
      cableCost,
      totalEquipmentCost,
      installationLaborCost,
      totalSystemCost
    });

    // Update quotation form
    setQuotationForm(prev => ({
      ...prev,
      equipmentCost: totalEquipmentCost,
      installationCost: installationLaborCost,
      totalCost: totalSystemCost,
      panelsNeeded: panelQuantity,
      systemSize: quotationForm.systemSize
    }));
  };

  // Add additional equipment item
  const addAdditionalEquipment = () => {
    setAdditionalEquipment([...additionalEquipment, { name: '', quantity: 1, price: 0, total: 0 }]);
  };

  const updateAdditionalEquipment = (index, field, value) => {
    const updated = [...additionalEquipment];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'price') {
      updated[index].total = (updated[index].quantity || 0) * (updated[index].price || 0);
    }
    setAdditionalEquipment(updated);

    const additionalTotal = updated.reduce((sum, item) => sum + (item.total || 0), 0);
    setCalculatedCosts(prev => ({
      ...prev,
      totalEquipmentCost: prev.totalEquipmentCost + additionalTotal,
      totalSystemCost: prev.totalSystemCost + additionalTotal
    }));
  };

  const removeAdditionalEquipment = (index) => {
    const updated = additionalEquipment.filter((_, i) => i !== index);
    setAdditionalEquipment(updated);
  };

  const hasDeviceAssigned = (item) => {
    return !!(item.iotDeviceId || item.assignedDevice || item.assignedDeviceId);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
  };

  const getFullAddress = (address) => {
    if (!address) return 'Address not specified';
    if (typeof address === 'object') {
      const parts = [
        address.houseOrBuilding,
        address.street,
        address.barangay,
        address.cityMunicipality,
        address.province,
        address.zipCode
      ].filter(part => part && part.trim());
      return parts.join(', ') || 'Address not specified';
    }
    return 'Address not specified';
  };

  const getSystemTypeLabel = (value) => {
    const type = SYSTEM_TYPES.find(t => t.value === value);
    return type ? type.label : 'Not specified';
  };

  const getStatusConfig = (item) => {
    if (item.type === 'free_quote') {
      return FREE_QUOTE_STATUS[item.status] || FREE_QUOTE_STATUS.pending;
    } else {
      return PRE_ASSESSMENT_STATUS[item.status] || PRE_ASSESSMENT_STATUS.pending_payment;
    }
  };

  const getTypeConfig = (type) => {
    return ASSESSMENT_TYPES[type] || ASSESSMENT_TYPES.free_quote;
  };

  const fetchAllAssessments = async () => {
    logger.info('fetchAllAssessments started');
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      
      logger.info('Session check:', {
        hasToken: !!token,
        tokenLength: token?.length,
        apiBaseUrl: API_BASE_URL,
        fullUrl: `${API_BASE_URL}/api/free-quotes/engineer/my-quotes`
      });

      if (!token) {
        logger.error('No authentication token found');
        showToast('Please login again to continue', 'error');
        setLoading(false);
        return;
      }

      const freeQuotesUrl = `${API_BASE_URL}/api/free-quotes/engineer/my-quotes`;
      const preAssessmentsUrl = `${API_BASE_URL}/api/pre-assessments/engineer/my-assessments`;
      
      logger.api('GET', freeQuotesUrl);
      logger.api('GET', preAssessmentsUrl);

      const [freeQuotesRes, preAssessmentsRes] = await Promise.all([
        axios.get(freeQuotesUrl, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(preAssessmentsUrl, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      logger.success('API Responses received', {
        freeQuotesStatus: freeQuotesRes.status,
        freeQuotesCount: freeQuotesRes.data.quotes?.length || 0,
        preAssessmentsStatus: preAssessmentsRes.status,
        preAssessmentsCount: preAssessmentsRes.data.assessments?.length || 0
      });

      const formattedFreeQuotes = (freeQuotesRes.data.quotes || []).map(quote => ({
        ...quote,
        type: 'free_quote',
        id: quote._id,
        clientId: quote.clientId?._id,
        clientName: quote.clientId?.contactFirstName || '',
        clientLastName: quote.clientId?.contactLastName || '',
        clientEmail: quote.clientId?.userId?.email || '',
        clientPhone: quote.clientId?.contactNumber || '',
        clientType: quote.clientId?.client_type || 'Residential',
        address: quote.addressId,
        bookingReference: quote.quotationReference,
        status: quote.status,
        preferredDate: quote.requestedAt,
        propertyType: quote.propertyType,
        desiredCapacity: quote.desiredCapacity,
        systemType: quote.systemType,
        monthlyBill: quote.monthlyBill,
        roofLength: quote.roofLength,
        roofWidth: quote.roofWidth
      }));

      const formattedPreAssessments = (preAssessmentsRes.data.assessments || []).map(assessment => ({
        ...assessment,
        type: 'pre_assessment',
        id: assessment._id,
        clientId: assessment.clientId?._id,
        clientName: assessment.clientId?.contactFirstName || '',
        clientLastName: assessment.clientId?.contactLastName || '',
        clientEmail: assessment.clientId?.userId?.email || '',
        clientPhone: assessment.clientId?.contactNumber || '',
        clientType: assessment.clientId?.client_type || 'Residential',
        address: assessment.addressId,
        status: assessment.assessmentStatus,
        preferredDate: assessment.preferredDate,
        propertyType: assessment.propertyType,
        desiredCapacity: assessment.desiredCapacity,
        systemType: assessment.systemType,
        roofType: assessment.roofType,
        roofLength: assessment.roofLength,
        roofWidth: assessment.roofWidth,
        assignedDevice: assessment.assignedDevice,
        assignedDeviceId: assessment.assignedDeviceId,
        iotDeviceId: assessment.iotDeviceId,
        deviceDeployedAt: assessment.deviceDeployedAt,
        deviceDeployedBy: assessment.deviceDeployedBy,
        dataCollectionStart: assessment.dataCollectionStart,
        dataCollectionEnd: assessment.dataCollectionEnd,
        totalReadings: assessment.totalReadings
      }));

      logger.info('Formatted data', {
        freeQuotesCount: formattedFreeQuotes.length,
        preAssessmentsCount: formattedPreAssessments.length,
        sampleFreeQuote: formattedFreeQuotes[0] ? {
          id: formattedFreeQuotes[0].id,
          status: formattedFreeQuotes[0].status,
          clientName: formattedFreeQuotes[0].clientName
        } : null
      });

      setFreeQuotes(formattedFreeQuotes);
      setPreAssessments(formattedPreAssessments);
      setAllAssessments([...formattedFreeQuotes, ...formattedPreAssessments]);
      setError(null);
      
      logger.success('All assessments loaded successfully', {
        total: formattedFreeQuotes.length + formattedPreAssessments.length
      });
      
    } catch (err) {
      logger.error('Error fetching assessments:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        statusText: err.response?.statusText,
        config: {
          url: err.config?.url,
          method: err.config?.method,
          headers: err.config?.headers
        }
      });
      
      let errorMessage = 'Failed to load assessments. ';
      if (err.response?.status === 401) {
        errorMessage += 'Authentication failed. Please login again.';
        logger.warn('Authentication failed - token may be expired');
      } else if (err.response?.status === 404) {
        errorMessage += 'API endpoint not found. Please check API configuration.';
        logger.warn('API endpoint not found - check VITE_API_URL');
      } else if (err.code === 'ERR_NETWORK') {
        errorMessage += 'Network error. Cannot connect to server.';
        logger.error('Network error - cannot reach API server');
      } else {
        errorMessage += err.response?.data?.message || err.message;
      }
      
      showToast(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setLoading(false);
      logger.info('fetchAllAssessments completed');
    }
  };

  const fetchFreeQuoteDetails = async (quoteId) => {
    logger.info('fetchFreeQuoteDetails started', { quoteId });
    try {
      const token = sessionStorage.getItem('token');
      const url = `${API_BASE_URL}/api/free-quotes/${quoteId}`;
      logger.api('GET', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      logger.success('Free quote details fetched', { quoteId, status: response.status });
      const quote = response.data.quote;

      let addressData = null;

      if (selectedItem && selectedItem.address) {
        addressData = selectedItem.address;
      } else if (quote.addressId && typeof quote.addressId === 'object') {
        addressData = quote.addressId;
      } else if (quote.address && typeof quote.address === 'object') {
        addressData = quote.address;
      } else if (quote.addressId && typeof quote.addressId === 'string') {
        const foundQuote = freeQuotes.find(fq => fq.id === quoteId);
        if (foundQuote && foundQuote.address) {
          addressData = foundQuote.address;
        }
      }

      const formattedQuote = {
        ...quote,
        clientName: quote.clientId?.contactFirstName || '',
        clientLastName: quote.clientId?.contactLastName || '',
        clientEmail: quote.clientId?.userId?.email || '',
        clientPhone: quote.clientId?.contactNumber || '',
        clientType: quote.clientId?.client_type || 'Residential',
        address: addressData,
        systemType: quote.systemType,
        roofLength: quote.roofLength,
        roofWidth: quote.roofWidth
      };

      setSelectedItem(formattedQuote);
      setSelectedType('free_quote');

      setFreeQuoteForm({
        quotationNumber: formattedQuote.quotationReference || '',
        quotationExpiryDate: '',
        systemSize: '',
        systemType: formattedQuote.systemType || 'grid-tie',
        panelsNeeded: '',
        panelType: '',
        inverterType: '',
        batteryType: '',
        installationCost: 0,
        equipmentCost: 0,
        totalCost: 0,
        paymentTerms: '',
        warrantyYears: 10,
        remarks: formattedQuote.adminRemarks || '',
        roofLength: formattedQuote.roofLength || '',
        roofWidth: formattedQuote.roofWidth || ''
      });
      
      logger.info('Free quote form populated');
    } catch (err) {
      logger.error('Error fetching free quote details:', {
        quoteId,
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      showToast('Failed to load quote details', 'error');
    }
  };

  const fetchPreAssessmentDetails = async (assessmentId) => {
    logger.info('fetchPreAssessmentDetails started', { assessmentId });
    try {
      const token = sessionStorage.getItem('token');
      const url = `${API_BASE_URL}/api/pre-assessments/${assessmentId}`;
      logger.api('GET', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      logger.success('Pre-assessment details fetched', { assessmentId, status: response.status });
      const assessment = response.data.assessment;

      let addressData = null;

      if (selectedItem && selectedItem.address) {
        addressData = selectedItem.address;
      } else if (assessment.addressId && typeof assessment.addressId === 'object') {
        addressData = assessment.addressId;
      } else if (assessment.address && typeof assessment.address === 'object') {
        addressData = assessment.address;
      } else if (assessment.addressId && typeof assessment.addressId === 'string') {
        const foundAssessment = preAssessments.find(pa => pa.id === assessmentId);
        if (foundAssessment && foundAssessment.address) {
          addressData = foundAssessment.address;
        }
      }

      const formattedAssessment = {
        ...assessment,
        clientName: assessment.clientId?.contactFirstName || '',
        clientLastName: assessment.clientId?.contactLastName || '',
        clientEmail: assessment.clientId?.userId?.email || '',
        clientPhone: assessment.clientId?.contactNumber || '',
        clientType: assessment.clientId?.client_type || 'Residential',
        assignedDevice: assessment.assignedDevice,
        assignedDeviceId: assessment.assignedDeviceId,
        iotDeviceId: assessment.iotDeviceId,
        deviceDeployedAt: assessment.deviceDeployedAt,
        deviceDeployedBy: assessment.deviceDeployedBy,
        address: addressData,
        systemType: assessment.systemType,
        roofType: assessment.roofType,
        roofLength: assessment.roofLength,
        roofWidth: assessment.roofWidth,
        dataCollectionStart: assessment.dataCollectionStart,
        dataCollectionEnd: assessment.dataCollectionEnd,
        totalReadings: assessment.totalReadings
      };

      setSelectedItem(formattedAssessment);
      setSelectedType('pre_assessment');

      if (assessment.engineerAssessment) {
        setAssessmentForm({
          roofCondition: assessment.engineerAssessment.roofCondition || '',
          roofLength: assessment.engineerAssessment.roofLength || formattedAssessment.roofLength || '',
          roofWidth: assessment.engineerAssessment.roofWidth || formattedAssessment.roofWidth || '',
          structuralIntegrity: assessment.engineerAssessment.structuralIntegrity || '',
          estimatedInstallationTime: assessment.engineerAssessment.estimatedInstallationTime || '',
          recommendations: assessment.engineerAssessment.recommendations || '',
          technicalFindings: assessment.technicalFindings || '',
          siteVisitNotes: assessment.engineerAssessment.inspectionNotes || ''
        });
      } else {
        setAssessmentForm({
          roofCondition: '',
          roofLength: formattedAssessment.roofLength || '',
          roofWidth: formattedAssessment.roofWidth || '',
          structuralIntegrity: '',
          estimatedInstallationTime: '',
          recommendations: '',
          technicalFindings: '',
          siteVisitNotes: ''
        });
      }

      // AUTO-GENERATE QUOTATION NUMBER AND EXPIRY DATE for Pre-Assessment
      const autoQuotationNumber = generateQuotationNumber();
      const autoExpiryDate = getExpiryDate30Days();

      if (assessment.quotation?.systemDetails) {
        setQuotationForm({
          quotationNumber: assessment.quotation.quotationNumber || autoQuotationNumber,
          quotationExpiryDate: assessment.quotation.quotationExpiryDate?.split('T')[0] || autoExpiryDate,
          systemSize: assessment.quotation.systemDetails.systemSize || '',
          systemType: assessment.quotation.systemDetails.systemType || formattedAssessment.systemType || 'grid-tie',
          panelsNeeded: assessment.quotation.systemDetails.panelsNeeded || '',
          panelType: assessment.quotation.systemDetails.panelType || '',
          inverterType: assessment.quotation.systemDetails.inverterType || '',
          batteryType: assessment.quotation.systemDetails.batteryType || '',
          installationCost: assessment.quotation.systemDetails.installationCost || 0,
          equipmentCost: assessment.quotation.systemDetails.equipmentCost || 0,
          totalCost: assessment.quotation.systemDetails.totalCost || 0,
          paymentTerms: assessment.quotation.systemDetails.paymentTerms || '',
          warrantyYears: assessment.quotation.systemDetails.warrantyYears || 10
        });
      } else {
        // ALWAYS populate with auto-generated values when no existing quotation
        setQuotationForm({
          quotationNumber: autoQuotationNumber,
          quotationExpiryDate: autoExpiryDate,
          systemSize: '',
          systemType: formattedAssessment.systemType || 'grid-tie',
          panelsNeeded: '',
          panelType: '',
          inverterType: '',
          batteryType: '',
          installationCost: 0,
          equipmentCost: 0,
          totalCost: 0,
          paymentTerms: '',
          warrantyYears: 10
        });
      }

      if (assessment.assessmentResults) {
        setIotAnalysis(assessment.assessmentResults);
      }

      if (assessment.sitePhotos) {
        setSiteImages(assessment.sitePhotos);
      }
      
      logger.info('Pre-assessment form populated', {
        hasIoTData: !!assessment.assessmentResults,
        hasPhotos: assessment.sitePhotos?.length > 0
      });
      
    } catch (err) {
      logger.error('Error fetching pre-assessment details:', {
        assessmentId,
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      showToast('Failed to load assessment details', 'error');
    }
  };

  const analyzeIoTData = async () => {
    if (!selectedItem || selectedType !== 'pre_assessment') return;

    setAnalyzingData(true);
    try {
      const token = sessionStorage.getItem('token');
      const url = `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/analyze-iot-data`;
      logger.api('POST', url);
      
      const response = await axios.post(
        url,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIotAnalysis(response.data.analysis);
      showToast('IoT data analysis completed successfully!', 'success');

      fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      logger.error('Error analyzing IoT data:', err);
      showToast(err.response?.data?.message || 'Failed to analyze IoT data', 'error');
    } finally {
      setAnalyzingData(false);
    }
  };

  const generateQuotationPDF = async () => {
    const systemSize = selectedType === 'free_quote' ? freeQuoteForm.systemSize : quotationForm.systemSize;
    const totalCost = selectedType === 'free_quote' ? freeQuoteForm.totalCost : calculatedCosts.totalSystemCost;

    if (!systemSize || parseFloat(systemSize) <= 0) {
      showToast('Please enter a valid system size (greater than 0)', 'warning');
      return;
    }

    if (!totalCost || parseFloat(totalCost) <= 0) {
      showToast('Please enter a valid total cost (greater than 0)', 'warning');
      return;
    }

    setGeneratingPDF(true);
    try {
      const token = sessionStorage.getItem('token');
      const endpoint = selectedType === 'free_quote'
        ? `${API_BASE_URL}/api/free-quotes/${selectedItem._id}/generate-quotation`
        : `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/generate-quotation`;

      const payload = selectedType === 'free_quote' ? {
        quotationNumber: freeQuoteForm.quotationNumber,
        quotationExpiryDate: freeQuoteForm.quotationExpiryDate,
        systemSize: parseFloat(freeQuoteForm.systemSize),
        systemType: freeQuoteForm.systemType,
        panelsNeeded: freeQuoteForm.panelsNeeded ? parseInt(freeQuoteForm.panelsNeeded) : 0,
        panelType: freeQuoteForm.panelType,
        inverterType: freeQuoteForm.inverterType,
        batteryType: freeQuoteForm.batteryType,
        installationCost: parseFloat(freeQuoteForm.installationCost) || 0,
        equipmentCost: parseFloat(freeQuoteForm.equipmentCost) || 0,
        totalCost: parseFloat(freeQuoteForm.totalCost),
        paymentTerms: freeQuoteForm.paymentTerms,
        warrantyYears: parseInt(freeQuoteForm.warrantyYears) || 10,
        remarks: freeQuoteForm.remarks,
        includeIoTData: false
      } : {
        quotationNumber: quotationForm.quotationNumber,
        quotationExpiryDate: quotationForm.quotationExpiryDate,
        systemSize: parseFloat(quotationForm.systemSize),
        systemType: quotationForm.systemType,
        panelsNeeded: panelQuantity,
        panelType: selectedPanel?.name || '',
        inverterType: selectedInverter?.name || '',
        batteryType: selectedBattery?.name || '',
        installationCost: calculatedCosts.installationLaborCost,
        equipmentCost: calculatedCosts.totalEquipmentCost,
        totalCost: calculatedCosts.totalSystemCost,
        paymentTerms: quotationForm.paymentTerms,
        warrantyYears: parseInt(quotationForm.warrantyYears) || 10,
        includeIoTData: includeIoTData,
        equipmentDetails: {
          panel: selectedPanel,
          panelQuantity: panelQuantity,
          inverter: selectedInverter,
          inverterQuantity: inverterQuantity,
          battery: selectedBattery,
          batteryQuantity: batteryQuantity,
          additionalEquipment: additionalEquipment
        }
      };

      logger.api('POST', endpoint, payload);
      const response = await axios.post(
        endpoint,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Quotation PDF generated and uploaded successfully!', 'success');

      if (selectedType === 'free_quote') {
        fetchFreeQuoteDetails(selectedItem._id);
      } else {
        fetchPreAssessmentDetails(selectedItem._id);
      }
    } catch (err) {
      logger.error('Error generating PDF:', err);
      showToast(err.response?.data?.message || 'Failed to generate PDF', 'error');
    } finally {
      setGeneratingPDF(false);
    }
  };

  const handleSelectItem = (item) => {
    logger.info('Selected item', { type: item.type, id: item.id });
    if (item.type === 'free_quote') {
      fetchFreeQuoteDetails(item.id);
    } else {
      fetchPreAssessmentDetails(item.id);
    }
    setActiveTab('overview');
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    setSelectedType(null);
    fetchAllAssessments();
  };

  const handleFreeQuoteFormChange = (field, value) => {
    setFreeQuoteForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAssessmentFormChange = (field, value) => {
    setAssessmentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleQuotationChange = (field, value) => {
    setQuotationForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      const token = sessionStorage.getItem('token');
      const url = `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/upload-images`;
      logger.api('POST', url, { filesCount: files.length });
      
      const response = await axios.post(
        url,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );
      setSiteImages([...siteImages, ...response.data.images]);
      showToast('Images uploaded successfully', 'success');
    } catch (err) {
      logger.error('Error uploading images:', err);
      showToast('Failed to upload images', 'error');
    } finally {
      setUploading(false);
      setShowImageUploader(false);
    }
  };

  const deployDevice = async () => {
    if (!window.confirm('Are you sure you want to deploy the device on site? This will start 7-day data collection.')) {
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const url = `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/deploy-device`;
      logger.api('POST', url, { notes: deployNotes });
      
      const response = await axios.post(
        url,
        { notes: deployNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(response.data.message || 'Device deployed successfully. Data collection started!', 'success');
      setDeployNotes('');
      fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      logger.error('Error deploying device:', err);
      showToast(err.response?.data?.message || 'Failed to deploy device', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const saveSiteAssessment = async () => {
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const url = `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/update-assessment`;
      logger.api('PUT', url, assessmentForm);
      
      await axios.put(
        url,
        assessmentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Site assessment saved successfully', 'success');
      fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      logger.error('Error saving assessment:', err);
      showToast('Failed to save assessment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitFinalReport = async () => {
    if (!window.confirm('Are you sure you want to submit the final report? This action cannot be undone.')) {
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const url = `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/submit-report`;
      logger.api('POST', url);
      
      await axios.post(
        url,
        {
          finalSystemSize: quotationForm.systemSize,
          finalSystemCost: calculatedCosts.totalSystemCost,
          recommendedSystemType: quotationForm.systemType,
          panelsNeeded: panelQuantity,
          estimatedAnnualProduction: (quotationForm.systemSize || 0) * 1200,
          estimatedAnnualSavings: (calculatedCosts.totalSystemCost || 0) * 0.15,
          paybackPeriod: Math.ceil((calculatedCosts.totalSystemCost || 0) / ((quotationForm.systemSize || 1) * 1200 * 0.1)),
          co2Offset: (quotationForm.systemSize || 0) * 800,
          engineerRecommendations: assessmentForm.recommendations,
          technicalFindings: assessmentForm.technicalFindings,
          equipmentBreakdown: {
            panel: selectedPanel,
            panelQuantity,
            inverter: selectedInverter,
            inverterQuantity,
            battery: selectedBattery,
            batteryQuantity,
            additionalEquipment
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Final report submitted successfully', 'success');
      fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      logger.error('Error submitting report:', err);
      showToast('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const url = `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/add-comment`;
      logger.api('POST', url, { comment: commentText });
      
      await axios.post(
        url,
        { comment: commentText, isPublic: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText('');
      showToast('Comment added successfully', 'success');
      fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      logger.error('Error adding comment:', err);
      showToast('Failed to add comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Fetch system config
  const fetchSystemConfig = async () => {
    logger.info('fetchSystemConfig started');
    try {
      const token = sessionStorage.getItem('token');
      const url = `${API_BASE_URL}/api/maintenance/config`;
      logger.api('GET', url);
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const configData = response.data.config;
      setConfig(configData);
      logger.success('System config fetched', { hasLaborRates: !!configData?.laborRates });

      await fetchAllEquipment();
    } catch (error) {
      logger.error('Error fetching config:', error);
    }
  };

  // Log environment on mount
  useEffect(() => {
    logger.info('=== APPLICATION STARTUP ===');
    logger.info('Environment:', {
      mode: import.meta.env.MODE,
      isProd: import.meta.env.PROD,
      isDev: import.meta.env.DEV,
      apiUrl: API_BASE_URL,
      hasApiUrl: !!API_BASE_URL,
      userAgent: navigator.userAgent,
      url: window.location.href
    });
    
    if (!API_BASE_URL && import.meta.env.PROD) {
      logger.warn('CRITICAL: VITE_API_URL is not set! API calls will use relative paths which will fail in production.');
    }
  }, []);

  useEffect(() => {
    fetchAllAssessments();
    fetchSystemConfig();
  }, []);

  useEffect(() => {
    let filtered = [...allAssessments];

    if (searchTerm) {
      filtered = filtered.filter(item => {
        const name = `${item.clientName || ''} ${item.clientLastName || ''}`.toLowerCase();
        const ref = (item.bookingReference || item.quotationReference || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || ref.includes(searchTerm.toLowerCase());
      });
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const status = item.type === 'free_quote' ? item.status : item.assessmentStatus;
        return status === statusFilter;
      });
    }

    setFilteredAssessments(filtered);
  }, [allAssessments, searchTerm, typeFilter, statusFilter]);

  useEffect(() => {
    const total = (quotationForm.installationCost || 0) + (quotationForm.equipmentCost || 0);
    setQuotationForm(prev => ({ ...prev, totalCost: total }));
  }, [quotationForm.installationCost, quotationForm.equipmentCost]);

  useEffect(() => {
    const total = (freeQuoteForm.installationCost || 0) + (freeQuoteForm.equipmentCost || 0);
    setFreeQuoteForm(prev => ({ ...prev, totalCost: total }));
  }, [freeQuoteForm.installationCost, freeQuoteForm.equipmentCost]);

  // Recalculate costs when selections change
  useEffect(() => {
    if (selectedType === 'pre_assessment') {
      calculateTotalCosts();
    }
  }, [selectedPanel, selectedInverter, selectedBattery, panelQuantity, inverterQuantity, batteryQuantity, quotationForm.systemSize, config]);

  // Skeleton Loader Components
  const SkeletonCard = () => (
    <div className="assessment-card-enad skeleton-card-enad">
      <div className="card-content-enad">
        <div className="card-header-enad">
          <div className="skeleton-badge-enad"></div>
          <div className="skeleton-badge-enad"></div>
        </div>
        <div className="skeleton-line-enad medium-enad"></div>
        <div className="skeleton-line-enad small-enad"></div>
        <div className="card-details-enad">
          <div className="skeleton-line-enad tiny-enad"></div>
          <div className="skeleton-line-enad tiny-enad"></div>
          <div className="skeleton-line-enad tiny-enad"></div>
        </div>
        <div className="card-footer-enad">
          <div className="skeleton-button-enad small-enad"></div>
        </div>
      </div>
    </div>
  );

  const SkeletonList = () => (
    <div className="my-assessments-enad">
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
        position="bottom-left"
      />
      <div className="assessments-header-enad">
        <div className="skeleton-line-enad large-enad"></div>
        <div className="skeleton-line-enad medium-enad"></div>
      </div>
      <div className="search-filters-enad">
        <div className="skeleton-search-enad"></div>
        <div className="skeleton-select-enad"></div>
        <div className="skeleton-select-enad"></div>
      </div>
      <div className="assessments-grid-enad">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );

  if (loading && allAssessments.length === 0) {
    return <SkeletonList />;
  }

  // Assessment List View
  if (!selectedItem) {
    const availableStatuses = [...new Set(allAssessments.map(item => {
      return item.type === 'free_quote' ? item.status : item.assessmentStatus;
    }))];

    return (
      <>
        <Helmet>
          <title>My Assessments | Engineer | SOLARIS</title>
        </Helmet>

        <div className="my-assessments-enad">
          <ToastNotification
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
            position="bottom-left"
          />

          <div className="assessments-header-enad">
            <h1>My Assessments</h1>
            <p>Manage free quotes and site assessments assigned to you</p>
          </div>

          <div className="search-filters-enad">
            <div className="search-wrapper-enad">
              <FaSearch className="search-icon-enad" />
              <input
                type="text"
                placeholder="Search by reference or client name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input-enad"
              />
            </div>
            <div className="filter-wrapper-enad">
              <FaFilter className="filter-icon-enad" />
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="filter-select-enad"
              >
                <option value="all">All Types</option>
                <option value="free_quote">Free Quotes</option>
                <option value="pre_assessment">Pre-Assessments</option>
              </select>
            </div>
            <div className="filter-wrapper-enad">
              <FaFilter className="filter-icon-enad" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="filter-select-enad"
              >
                <option value="all">All Status</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>
                    {status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && (
            <div className="error-container-enad">
              <FaExclamationTriangle />
              <span>{error}</span>
            </div>
          )}

          {filteredAssessments.length === 0 ? (
            <div className="empty-state-enad">
              <FaClipboardList className="empty-icon-enad" />
              <h3>No assessments found</h3>
              <p>
                {allAssessments.length === 0
                  ? "You don't have any assessments assigned yet."
                  : "No assessments match your search criteria."}
              </p>
            </div>
          ) : (
            <div className="assessments-grid-enad">
              {filteredAssessments.map((item) => {
                const StatusConfig = getStatusConfig(item);
                const TypeConfig = getTypeConfig(item.type);
                const StatusIcon = StatusConfig.icon;
                const TypeIcon = TypeConfig.icon;
                return (
                  <div
                    key={`${item.type}-${item.id}`}
                    className="assessment-card-enad"
                    onClick={() => handleSelectItem(item)}
                  >
                    <div className="card-content-enad">
                      <div className="card-header-enad">
                        <div className={`type-badge-enad ${TypeConfig.color}`}>
                          <TypeIcon />
                          {TypeConfig.label}
                        </div>
                        <div className={`status-badge-enad ${StatusConfig.color}`}>
                          <StatusIcon />
                          {StatusConfig.label}
                        </div>
                      </div>

                      <h3 className="client-name-enad">
                        {item.clientName} {item.clientLastName}
                      </h3>
                      <p className="reference-enad">
                        Ref: {item.bookingReference || item.quotationReference}
                      </p>

                      <div className="card-details-enad">
                        <div className="detail-item-enad">
                          <FaMapMarkerAlt className="detail-icon-enad" />
                          <span className="truncate">{getFullAddress(item.address)}</span>
                        </div>
                        <div className="detail-item-enad">
                          <FaCalendarAlt className="detail-icon-enad" />
                          <span>Requested: {formatDate(item.preferredDate || item.requestedAt)}</span>
                        </div>
                        <div className="detail-item-enad">
                          <FaHome className="detail-icon-enad" />
                          <span className="capitalize">{item.propertyType || 'N/A'}</span>
                        </div>
                        {item.systemType && (
                          <div className="detail-item-enad">
                            <FaSolarPanel className="detail-icon-enad" />
                            <span>System: {getSystemTypeLabel(item.systemType)}</span>
                          </div>
                        )}
                        {(item.roofLength || item.roofWidth) && (
                          <div className="detail-item-enad">
                            <FaRulerCombined className="detail-icon-enad" />
                            <span>Roof: {item.roofLength || '?'}m x {item.roofWidth || '?'}m</span>
                          </div>
                        )}
                        {item.type === 'free_quote' && item.monthlyBill && (
                          <div className="detail-item-enad">
                            <FaDollarSign className="detail-icon-enad" />
                            <span>Monthly Bill: {formatCurrency(item.monthlyBill)}</span>
                          </div>
                        )}
                        {item.type === 'pre_assessment' && hasDeviceAssigned(item) && (
                          <div className="detail-item-enad">
                            <FaMicrochip className="detail-icon-enad" />
                            <span className="badge-small-enad">Device Assigned</span>
                          </div>
                        )}
                        {item.type === 'pre_assessment' && item.dataCollectionStart && (
                          <div className="detail-item-enad">
                            <FaChartLine className="detail-icon-enad" />
                            <span>Data Collection: {formatDate(item.dataCollectionStart)} - {formatDate(item.dataCollectionEnd) || 'Ongoing'}</span>
                          </div>
                        )}
                      </div>

                      <div className="card-footer-enad">
                        <div className="card-badges-enad">
                          {item.type === 'pre_assessment' && item.sitePhotos?.length > 0 && (
                            <span className="badge-small-enad photos-enad">
                              <FaCamera /> {item.sitePhotos.length} Photos
                            </span>
                          )}
                          {item.type === 'pre_assessment' && item.totalReadings > 0 && (
                            <span className="badge-small-enad data-enad">
                              <FaChartLine /> {item.totalReadings} Readings
                            </span>
                          )}
                          {item.type === 'free_quote' && item.quotationFile && (
                            <span className="badge-small-enad quotation-enad">
                              <FaFilePdf /> Quotation Ready
                            </span>
                          )}
                        </div>
                        <button className="view-link-enad">
                          View Details <FaArrowLeft className="rotate-180" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  // Detail View for Free Quote
  if (selectedType === 'free_quote') {
    const StatusConfig = getStatusConfig(selectedItem);
    const TypeConfig = getTypeConfig('free_quote');
    const StatusIcon = StatusConfig.icon;
    const TypeIcon = TypeConfig.icon;

    return (
      <>
        <Helmet>
          <title>Free Quote Details | Engineer | SOLARIS</title>
        </Helmet>

        <div className="my-assessments-enad">
          <ToastNotification
            show={toast.show}
            message={toast.message}
            type={toast.type}
            onClose={hideToast}
            position="bottom-left"
          />

          <div className="detail-view-enad">
            <div className="detail-content-enad">
              <button onClick={handleBackToList} className="back-button-enad">
                <FaArrowLeft /> Back to Assessments
              </button>

              <div className="detail-header-enad">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`type-badge-enad ${TypeConfig.color}`}>
                      <TypeIcon /> {TypeConfig.label}
                    </span>
                    <h1 className="detail-title-enad">{selectedItem.quotationReference}</h1>
                  </div>
                  <div className="client-meta-enad">
                    <div className="client-meta-item-enad">
                      <FaUser /> {selectedItem.clientName} {selectedItem.clientLastName}
                    </div>
                    <div className="client-meta-item-enad">
                      <FaEnvelope /> {selectedItem.clientEmail || 'No email'}
                    </div>
                    <div className="client-meta-item-enad">
                      <FaPhone /> {selectedItem.clientPhone || 'No contact'}
                    </div>
                    <div className="client-meta-item-enad">
                      <FaBuilding /> <span className="capitalize">{selectedItem.clientType || 'Residential'}</span>
                    </div>
                  </div>
                </div>
                <div className={`status-badge-enad ${StatusConfig.color}`}>
                  <StatusIcon /> {StatusConfig.label}
                </div>
              </div>

              <div className="info-grid-enad">
                <div className="info-item-enad">
                  <span className="info-label-enad">Monthly Bill</span>
                  <span className="info-value-enad">{formatCurrency(selectedItem.monthlyBill)}</span>
                </div>
                <div className="info-item-enad">
                  <span className="info-label-enad">Property Type</span>
                  <span className="info-value-enad capitalize">{selectedItem.propertyType}</span>
                </div>
                <div className="info-item-enad">
                  <span className="info-label-enad">Desired Capacity</span>
                  <span className="info-value-enad">{selectedItem.desiredCapacity || 'Not specified'}</span>
                </div>
                {selectedItem.systemType && (
                  <div className="info-item-enad">
                    <span className="info-label-enad">Preferred System Type</span>
                    <span className="info-value-enad">
                      <FaSolarPanel className="inline-icon" />
                      {getSystemTypeLabel(selectedItem.systemType)}
                    </span>
                  </div>
                )}
                {(selectedItem.roofLength || selectedItem.roofWidth) && (
                  <div className="info-item-enad">
                    <span className="info-label-enad">Roof Dimensions</span>
                    <span className="info-value-enad">
                      <FaRulerCombined className="inline-icon" />
                      {selectedItem.roofLength ? `${selectedItem.roofLength}m` : '?'} x {selectedItem.roofWidth ? `${selectedItem.roofWidth}m` : '?'}
                    </span>
                  </div>
                )}
                <div className="info-item-enad">
                  <span className="info-label-enad">Requested Date</span>
                  <span className="info-value-enad">{formatDate(selectedItem.requestedAt)}</span>
                </div>
                <div className="info-item-enad info-full-width-enad">
                  <span className="info-label-enad">Address</span>
                  <span className="info-value-enad">{getFullAddress(selectedItem.address)}</span>
                </div>
              </div>

              <div className="detail-section-enad">
                <h3 className="detail-section-title-enad">Generate Quotation</h3>

                <div className="form-grid-enad">
                  <div className="form-group-enad">
                    <label className="form-label-enad">Quotation Number</label>
                    <input
                      type="text"
                      value={freeQuoteForm.quotationNumber}
                      onChange={(e) => handleFreeQuoteFormChange('quotationNumber', e.target.value)}
                      className="form-input-enad"
                    />
                  </div>
                  <div className="form-group-enad">
                    <label className="form-label-enad">Expiry Date</label>
                    <input
                      type="date"
                      value={freeQuoteForm.quotationExpiryDate}
                      onChange={(e) => handleFreeQuoteFormChange('quotationExpiryDate', e.target.value)}
                      className="form-input-enad"
                    />
                  </div>
                  <div className="form-group-enad">
                    <label className="form-label-enad">System Size (kWp) *</label>
                    <input
                      type="number"
                      step="0.1"
                      value={freeQuoteForm.systemSize}
                      onChange={(e) => handleFreeQuoteFormChange('systemSize', parseFloat(e.target.value))}
                      className="form-input-enad"
                      placeholder="e.g., 5.0"
                    />
                  </div>
                  <div className="form-group-enad">
                    <label className="form-label-enad">Equipment Cost (₱)</label>
                    <input
                      type="number"
                      value={freeQuoteForm.equipmentCost}
                      onChange={(e) => handleFreeQuoteFormChange('equipmentCost', parseFloat(e.target.value))}
                      className="form-input-enad"
                    />
                  </div>
                  <div className="form-group-enad">
                    <label className="form-label-enad">Installation Cost (₱)</label>
                    <input
                      type="number"
                      value={freeQuoteForm.installationCost}
                      onChange={(e) => handleFreeQuoteFormChange('installationCost', parseFloat(e.target.value))}
                      className="form-input-enad"
                    />
                  </div>
                </div>

                <div className="cost-summary-enad">
                  <div className="cost-row-enad">
                    <span className="cost-label-enad">Total Cost *:</span>
                    <span className="cost-value-enad total-cost-enad">{formatCurrency(freeQuoteForm.totalCost)}</span>
                  </div>
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">Payment Terms</label>
                  <textarea
                    value={freeQuoteForm.paymentTerms}
                    onChange={(e) => handleFreeQuoteFormChange('paymentTerms', e.target.value)}
                    rows={2}
                    className="form-textarea-enad"
                  />
                </div>

                <div className="action-buttons-enad" style={{ marginTop: '20px' }}>
                  <button
                    onClick={generateQuotationPDF}
                    disabled={generatingPDF || !freeQuoteForm.systemSize || !freeQuoteForm.totalCost}
                    className="btn-primary-enad"
                  >
                    {generatingPDF ? <FaSpinner className="spinner-enad" /> : <FaFilePdf />} Generate & Upload PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Detail View for Pre-Assessment
  const StatusConfig = getStatusConfig(selectedItem);
  const TypeConfig = getTypeConfig('pre_assessment');
  const StatusIcon = StatusConfig.icon;
  const TypeIcon = TypeConfig.icon;
  const deviceAssigned = hasDeviceAssigned(selectedItem);
  const hasDataCollection = selectedItem.dataCollectionStart && selectedItem.dataCollectionEnd;
  const canAnalyze = selectedItem.dataCollectionEnd && !iotAnalysis;

  return (
    <>
      <Helmet>
        <title>Pre-Assessment Details | Engineer | SOLARIS</title>
      </Helmet>

      <div className="my-assessments-enad">
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position="bottom-left"
        />

        <div className="detail-view-enad">
          <div className="detail-content-enad">
            <button onClick={handleBackToList} className="back-button-enad">
              <FaArrowLeft /> Back to Assessments
            </button>

            <div className="detail-header-enad">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`type-badge-enad ${TypeConfig.color}`}>
                    <TypeIcon /> {TypeConfig.label}
                  </span>
                  <h1 className="detail-title-enad">{selectedItem.bookingReference}</h1>
                </div>
                <div className="client-meta-enad">
                  <div className="client-meta-item-enad">
                    <FaUser /> {selectedItem.clientName} {selectedItem.clientLastName}
                  </div>
                  <div className="client-meta-item-enad">
                    <FaEnvelope /> {selectedItem.clientEmail || 'No email'}
                  </div>
                  <div className="client-meta-item-enad">
                    <FaPhone /> {selectedItem.clientPhone || 'No contact'}
                  </div>
                  <div className="client-meta-item-enad">
                    <FaBuilding /> <span className="capitalize">{selectedItem.clientType || 'Residential'}</span>
                  </div>
                </div>
              </div>
              <div className={`status-badge-enad ${StatusConfig.color}`}>
                <StatusIcon /> {StatusConfig.label}
              </div>
            </div>

            <div className="tabs-enad">
              {['overview', 'site-inspection', 'quotation', 'documents', 'comments'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`tab-btn-enad ${activeTab === tab ? 'active-enad' : ''}`}
                >
                  {tab === 'overview' && 'Overview'}
                  {tab === 'site-inspection' && 'Site Inspection'}
                  {tab === 'quotation' && 'Quotation'}
                  {tab === 'documents' && 'Documents'}
                  {tab === 'comments' && 'Comments'}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <div className="info-grid-enad">
                  <div className="info-item-enad">
                    <span className="info-label-enad">Address</span>
                    <span className="info-value-enad">{getFullAddress(selectedItem.address)}</span>
                  </div>
                  <div className="info-item-enad">
                    <span className="info-label-enad">Property Type</span>
                    <span className="info-value-enad capitalize">{selectedItem.propertyType}</span>
                  </div>
                  {selectedItem.systemType && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Preferred System Type</span>
                      <span className="info-value-enad">
                        <FaSolarPanel className="inline-icon" />
                        {getSystemTypeLabel(selectedItem.systemType)}
                      </span>
                    </div>
                  )}
                  <div className="info-item-enad">
                    <span className="info-label-enad">Roof Type</span>
                    <span className="info-value-enad capitalize">{selectedItem.roofType || 'Not specified'}</span>
                  </div>
                  {(selectedItem.roofLength || selectedItem.roofWidth) && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Roof Dimensions (from client)</span>
                      <span className="info-value-enad">
                        <FaRulerCombined className="inline-icon" />
                        {selectedItem.roofLength ? `${selectedItem.roofLength}m` : '?'} x {selectedItem.roofWidth ? `${selectedItem.roofWidth}m` : '?'}
                      </span>
                    </div>
                  )}
                  <div className="info-item-enad">
                    <span className="info-label-enad">Desired Capacity</span>
                    <span className="info-value-enad">{selectedItem.desiredCapacity || 'Not specified'}</span>
                  </div>
                  <div className="info-item-enad">
                    <span className="info-label-enad">Booked Date</span>
                    <span className="info-value-enad">{formatDate(selectedItem.bookedAt)}</span>
                  </div>
                  <div className="info-item-enad">
                    <span className="info-label-enad">Preferred Date</span>
                    <span className="info-value-enad">{formatDate(selectedItem.preferredDate)}</span>
                  </div>
                  {selectedItem.siteVisitDate && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Site Visit Date</span>
                      <span className="info-value-enad">{formatDate(selectedItem.siteVisitDate)}</span>
                    </div>
                  )}
                  {selectedItem.deviceDeployedAt && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Device Deployed</span>
                      <span className="info-value-enad">{formatDateTime(selectedItem.deviceDeployedAt)}</span>
                    </div>
                  )}
                  {selectedItem.dataCollectionStart && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Data Collection Start</span>
                      <span className="info-value-enad">{formatDateTime(selectedItem.dataCollectionStart)}</span>
                    </div>
                  )}
                  {selectedItem.dataCollectionEnd && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Data Collection End</span>
                      <span className="info-value-enad">{formatDateTime(selectedItem.dataCollectionEnd)}</span>
                    </div>
                  )}
                  {selectedItem.totalReadings > 0 && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Total Readings</span>
                      <span className="info-value-enad">{selectedItem.totalReadings}</span>
                    </div>
                  )}
                  <div className="info-item-enad">
                    <span className="info-label-enad">Assessment Fee</span>
                    <span className="info-value-enad">{formatCurrency(selectedItem.assessmentFee)}</span>
                  </div>
                  <div className="info-item-enad">
                    <span className="info-label-enad">Payment Status</span>
                    <span className={`status-badge-enad ${selectedItem.paymentStatus === 'paid' ? 'completed-enad' : 'pending-enad'}`}>
                      {selectedItem.paymentStatus}
                    </span>
                  </div>
                </div>

                {hasDataCollection && (
                  <div className="detail-section-enad">
                    <div className="section-header-enad">
                      <h3 className="detail-section-title-enad">IoT Data Analysis (7-Day Monitoring)</h3>
                      {canAnalyze && (
                        <button
                          onClick={analyzeIoTData}
                          disabled={analyzingData}
                          className="btn-secondary-enad"
                          style={{ padding: '5px 12px', fontSize: '12px' }}
                        >
                          {analyzingData ? <FaSpinner className="spinner-enad" /> : <FaChartArea />} Analyze Data
                        </button>
                      )}
                    </div>

                    {iotAnalysis ? (
                      <div className="iot-analysis-grid-enad">
                        <div className="analysis-card-enad irradiance-enad">
                          <FaSun className="analysis-icon-enad" />
                          <div className="analysis-stats-enad">
                            <div className="stat-enad">
                              <span className="stat-label-enad">Avg Irradiance</span>
                              <span className="stat-value-enad">{iotAnalysis.averageIrradiance?.toFixed(0) || 0} W/m²</span>
                            </div>
                            <div className="stat-enad">
                              <span className="stat-label-enad">Peak Irradiance</span>
                              <span className="stat-value-enad">{iotAnalysis.maxIrradiance?.toFixed(0) || 0} W/m²</span>
                            </div>
                            <div className="stat-enad">
                              <span className="stat-label-enad">Peak Sun Hours</span>
                              <span className="stat-value-enad">{iotAnalysis.peakSunHours?.toFixed(1) || 0} hrs/day</span>
                            </div>
                          </div>
                        </div>

                        <div className="analysis-card-enad temperature-enad">
                          <FaThermometerHalf className="analysis-icon-enad" />
                          <div className="analysis-stats-enad">
                            <div className="stat-enad">
                              <span className="stat-label-enad">Avg Temperature</span>
                              <span className="stat-value-enad">{iotAnalysis.averageTemperature?.toFixed(1) || 0}°C</span>
                            </div>
                            <div className="stat-enad">
                              <span className="stat-label-enad">Temperature Range</span>
                              <span className="stat-value-enad">{iotAnalysis.minTemperature?.toFixed(1) || 0}°C - {iotAnalysis.maxTemperature?.toFixed(1) || 0}°C</span>
                            </div>
                            <div className="stat-enad">
                              <span className="stat-label-enad">Efficiency Loss</span>
                              <span className="stat-value-enad">{iotAnalysis.efficiencyLoss || 0}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="analysis-card-enad humidity-enad">
                          <FaTint className="analysis-icon-enad" />
                          <div className="analysis-stats-enad">
                            <div className="stat-enad">
                              <span className="stat-label-enad">Avg Humidity</span>
                              <span className="stat-value-enad">{iotAnalysis.averageHumidity?.toFixed(0) || 0}%</span>
                            </div>
                            <div className="stat-enad">
                              <span className="stat-label-enad">Humidity Range</span>
                              <span className="stat-value-enad">{iotAnalysis.minHumidity?.toFixed(0) || 0}% - {iotAnalysis.maxHumidity?.toFixed(0) || 0}%</span>
                            </div>
                          </div>
                        </div>

                        <div className="analysis-card-enad recommendations-enad">
                          <FaChartBar className="analysis-icon-enad" />
                          <div className="analysis-stats-enad">
                            <div className="stat-enad">
                              <span className="stat-label-enad">Recommended System Size</span>
                              <span className="stat-value-enad">{iotAnalysis.recommendedSystemSize || 0} kWp</span>
                            </div>
                            <div className="stat-enad">
                              <span className="stat-label-enad">Optimal Orientation</span>
                              <span className="stat-value-enad">{iotAnalysis.recommendedOrientation || 'South-facing'}</span>
                            </div>
                            <div className="stat-enad">
                              <span className="stat-label-enad">Recommended Tilt Angle</span>
                              <span className="stat-value-enad">{iotAnalysis.recommendedTiltAngle || 15}°</span>
                            </div>
                            <div className="stat-enad">
                              <span className="stat-label-enad">Shading Detection</span>
                              <span className="stat-value-enad">{iotAnalysis.shadingPercentage ? `${iotAnalysis.shadingPercentage}% shading` : 'Minimal'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="no-data-enad">
                        <p>Click "Analyze Data" to process the 7-day IoT monitoring data and get system recommendations.</p>
                      </div>
                    )}
                  </div>
                )}

                {deviceAssigned ? (
                  <div className="device-card-enad">
                    <div className="device-card-title-enad">
                      <FaMicrochip /> Assigned Device
                    </div>
                    <div className="device-info-enad">
                      <div className="device-info-item-enad">
                        <span className="device-info-label-enad">Device ID</span>
                        <span className="device-info-value-enad">
                          {selectedItem.iotDeviceId?.deviceId ||
                            selectedItem.assignedDevice?.deviceId ||
                            selectedItem.assignedDeviceId ||
                            'N/A'}
                        </span>
                      </div>
                      <div className="device-info-item-enad">
                        <span className="device-info-label-enad">Device Name</span>
                        <span className="device-info-value-enad">
                          {selectedItem.iotDeviceId?.deviceName || selectedItem.assignedDevice?.deviceName || 'IoT Device'}
                        </span>
                      </div>
                      <div className="device-info-item-enad">
                        <span className="device-info-label-enad">Status</span>
                        <span className={`device-info-value-enad ${selectedItem.deviceDeployedAt ? 'text-green-600' : 'text-yellow-600'}`}>
                          {selectedItem.deviceDeployedAt ? 'Deployed' : 'Ready for Deployment'}
                        </span>
                      </div>
                      {selectedItem.deviceDeployedAt && (
                        <>
                          <div className="device-info-item-enad">
                            <span className="device-info-label-enad">Deployed At</span>
                            <span className="device-info-value-enad">{formatDateTime(selectedItem.deviceDeployedAt)}</span>
                          </div>
                          
                        </>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="no-device-card-enad">
                    <FaExclamationTriangle /> No device assigned yet. Please contact admin.
                  </div>
                )}
              </div>
            )}

            {/* Site Inspection Tab */}
            {activeTab === 'site-inspection' && (
              <div>
                <div className="action-buttons-enad">
                  <button
                    onClick={saveSiteAssessment}
                    disabled={submitting}
                    className="btn-secondary-enad"
                  >
                    {submitting ? <FaSpinner className="spinner-enad" /> : <FaSave />} Save Draft
                  </button>
                  {selectedItem.assessmentStatus !== 'device_deployed' &&
                    selectedItem.assessmentStatus !== 'data_collecting' &&
                    deviceAssigned && (
                      <button
                        onClick={deployDevice}
                        disabled={submitting}
                        className="btn-success-enad"
                      >
                        {submitting ? <FaSpinner className="spinner-enad" /> : <FaMicrochip />} Deploy Device (Start 7-day Monitoring)
                      </button>
                    )}
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">Roof Condition</label>
                  <div className="options-group-enad">
                    {ROOF_CONDITIONS.map(condition => (
                      <button
                        key={condition.value}
                        type="button"
                        onClick={() => handleAssessmentFormChange('roofCondition', condition.value)}
                        className={`option-btn-enad ${assessmentForm.roofCondition === condition.value ? 'active-enad' : ''}`}
                      >
                        {condition.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">
                    <FaRulerCombined className="inline-icon" /> Roof Dimensions (meters)
                  </label>
                  <div className="form-row-enad">
                    <div className="dimension-input-enad">
                      <FaArrowsAltH className="dimension-icon-small-enad" />
                      <input
                        type="number"
                        step="0.1"
                        value={assessmentForm.roofLength || ''}
                        onChange={(e) => handleAssessmentFormChange('roofLength', parseFloat(e.target.value))}
                        className="form-input-enad"
                        placeholder="Length (m)"
                      />
                    </div>
                    <div className="dimension-input-enad">
                      <FaArrowsAltV className="dimension-icon-small-enad" />
                      <input
                        type="number"
                        step="0.1"
                        value={assessmentForm.roofWidth || ''}
                        onChange={(e) => handleAssessmentFormChange('roofWidth', parseFloat(e.target.value))}
                        className="form-input-enad"
                        placeholder="Width (m)"
                      />
                    </div>
                  </div>
                  <small className="form-hint-enad">Measured during site inspection</small>
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">Structural Integrity</label>
                  <div className="options-group-enad">
                    {STRUCTURAL_INTEGRITY.map(integrity => (
                      <button
                        key={integrity.value}
                        type="button"
                        onClick={() => handleAssessmentFormChange('structuralIntegrity', integrity.value)}
                        className={`option-btn-enad ${assessmentForm.structuralIntegrity === integrity.value ? 'active-enad' : ''}`}
                      >
                        {integrity.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">Estimated Installation Time (days)</label>
                  <input
                    type="number"
                    value={assessmentForm.estimatedInstallationTime}
                    onChange={(e) => handleAssessmentFormChange('estimatedInstallationTime', e.target.value)}
                    className="form-input-enad"
                    style={{ width: '150px' }}
                  />
                </div>

                {deviceAssigned && (
                  <div className="form-group-enad">
                    <label className="form-label-enad">Deployment Notes</label>
                    <textarea
                      value={deployNotes}
                      onChange={(e) => setDeployNotes(e.target.value)}
                      rows={3}
                      className="form-textarea-enad"
                      placeholder="Enter deployment notes, device placement location, etc..."
                    />
                  </div>
                )}

                <div className="form-group-enad">
                  <label className="form-label-enad">Site Visit Notes</label>
                  <textarea
                    value={assessmentForm.siteVisitNotes}
                    onChange={(e) => handleAssessmentFormChange('siteVisitNotes', e.target.value)}
                    rows={4}
                    className="form-textarea-enad"
                    placeholder="Additional notes, observations, recommendations..."
                  />
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">Engineer Recommendations</label>
                  <textarea
                    value={assessmentForm.recommendations}
                    onChange={(e) => handleAssessmentFormChange('recommendations', e.target.value)}
                    rows={3}
                    className="form-textarea-enad"
                    placeholder="Summary of recommendations for the client..."
                  />
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">Technical Findings</label>
                  <textarea
                    value={assessmentForm.technicalFindings}
                    onChange={(e) => handleAssessmentFormChange('technicalFindings', e.target.value)}
                    rows={3}
                    className="form-textarea-enad"
                    placeholder="Technical observations, electrical assessment, structural findings..."
                  />
                </div>
              </div>
            )}

            {/* Quotation Tab with Equipment Selection */}
            {activeTab === 'quotation' && (
              <div className="quotation-tab-enhanced">
                <div className="action-buttons-enad">
                  {selectedItem.assessmentStatus !== 'completed' && (
                    <button
                      onClick={submitFinalReport}
                      disabled={submitting}
                      className="btn-success-enad"
                    >
                      {submitting ? <FaSpinner className="spinner-enad" /> : <FaCheckCircle />} Submit Final Report
                    </button>
                  )}
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">
                    <input
                      type="checkbox"
                      checked={includeIoTData}
                      onChange={(e) => setIncludeIoTData(e.target.checked)}
                      style={{ marginRight: '8px' }}
                    />
                    Include IoT Data Analysis in PDF
                  </label>
                  {selectedItem.dataCollectionStart && selectedItem.dataCollectionEnd && (
                    <small className="form-hint-enad">
                      IoT data collected from {formatDateTime(selectedItem.dataCollectionStart)} to {formatDateTime(selectedItem.dataCollectionEnd)}
                    </small>
                  )}
                </div>

                {/* Basic Info Section */}
                <div className="quotation-section">
                  <h4>Basic Information</h4>
                  <div className="form-grid-enad">
                    <div className="form-group-enad">
                      <label>Quotation Number</label>
                      <input
                        type="text"
                        value={quotationForm.quotationNumber} 
                        onChange={(e) => handleQuotationChange('quotationNumber', e.target.value)}
                        placeholder="Auto-generated"
                      />
                    </div>
                    <div className="form-group-enad">
                      <label>Expiry Date (30 Days)</label>
                      <input
                        type="date"
                        value={quotationForm.quotationExpiryDate} 
                        onChange={(e) => handleQuotationChange('quotationExpiryDate', e.target.value)}
                      />
                    </div>
                    <div className="form-group-enad">
                      <label>System Type</label>
                      <select
                        value={quotationForm.systemType}
                        onChange={(e) => handleQuotationChange('systemType', e.target.value)}
                      >
                        {SYSTEM_TYPES.map(type => (
                          <option key={type.value} value={type.value}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group-enad">
                      <label>System Size (kWp)</label>
                      <input
                        type="number"
                        step="0.5"
                        value={quotationForm.systemSize}
                        onChange={(e) => handleQuotationChange('systemSize', parseFloat(e.target.value))}
                        placeholder="e.g., 5.0"
                      />
                    </div>
                  </div>
                </div>

                {/* Solar Panel Selection */}
                <div className="quotation-section">
                  <h4><FaSolarPanel /> Solar Panels</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <label>Select Panel Model</label>
                      <select
                        value={selectedPanel?._id || ''}
                        onChange={(e) => {
                          const panel = availablePanels.find(p => p._id === e.target.value);
                          setSelectedPanel(panel);
                          if (panel && panel.unit === 'watt') {
                            setPanelQuantity(1);
                          }
                        }}
                      >
                        <option value="">-- Select Panel --</option>
                        {availablePanels.filter(p => p.isActive).map(panel => (
                          <option key={panel._id} value={panel._id}>
                            {panel.name} - {panel.brand} - ₱{panel.price.toLocaleString()}/{panel.unit}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <label>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={panelQuantity}
                        onChange={(e) => setPanelQuantity(parseInt(e.target.value) || 0)}
                        disabled={selectedPanel?.unit === 'watt'}
                      />
                    </div>
                    <div className="cost-display">
                      <label>Panel Cost</label>
                      <div className="cost-value">{formatCurrency(calculatedCosts.panelCost)}</div>
                    </div>
                  </div>
                  {selectedPanel?.unit === 'watt' && (
                    <small className="form-hint">Price is per watt. Total calculated based on system size: {quotationForm.systemSize} kWp</small>
                  )}
                </div>

                {/* Inverter Selection */}
                <div className="quotation-section">
                  <h4><FaBolt /> Inverters</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <label>Select Inverter Model</label>
                      <select
                        value={selectedInverter?._id || ''}
                        onChange={(e) => {
                          const inverter = availableInverters.find(i => i._id === e.target.value);
                          setSelectedInverter(inverter);
                        }}
                      >
                        <option value="">-- Select Inverter --</option>
                        {availableInverters.filter(i => i.isActive).map(inverter => (
                          <option key={inverter._id} value={inverter._id}>
                            {inverter.name} - {inverter.brand} - ₱{inverter.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <label>Quantity</label>
                      <input
                        type="number"
                        min="1"
                        value={inverterQuantity}
                        onChange={(e) => setInverterQuantity(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="cost-display">
                      <label>Inverter Cost</label>
                      <div className="cost-value">{formatCurrency(calculatedCosts.inverterCost)}</div>
                    </div>
                  </div>
                </div>

                {/* Battery Selection (Optional) */}
                <div className="quotation-section">
                  <h4><FaBatteryFull /> Batteries (Optional)</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <label>Select Battery Model</label>
                      <select
                        value={selectedBattery?._id || ''}
                        onChange={(e) => {
                          const battery = availableBatteries.find(b => b._id === e.target.value);
                          setSelectedBattery(battery);
                        }}
                      >
                        <option value="">-- No Battery --</option>
                        {availableBatteries.filter(b => b.isActive).map(battery => (
                          <option key={battery._id} value={battery._id}>
                            {battery.name} - {battery.brand} - ₱{battery.price.toLocaleString()}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <label>Quantity</label>
                      <input
                        type="number"
                        min="0"
                        value={batteryQuantity}
                        onChange={(e) => setBatteryQuantity(parseInt(e.target.value) || 0)}
                      />
                    </div>
                    <div className="cost-display">
                      <label>Battery Cost</label>
                      <div className="cost-value">{formatCurrency(calculatedCosts.batteryCost)}</div>
                    </div>
                  </div>
                </div>

                {/* Estimated Other Costs */}
                <div className="quotation-section">
                  <h4><FaTools /> Estimated Other Materials</h4>
                  <div className="estimated-costs-grid">
                    <div className="estimated-cost-item">
                      <span>Mounting Structure</span>
                      <strong>{formatCurrency(calculatedCosts.mountingCost)}</strong>
                    </div>
                    <div className="estimated-cost-item">
                      <span>Electrical Components</span>
                      <strong>{formatCurrency(calculatedCosts.electricalCost)}</strong>
                    </div>
                    <div className="estimated-cost-item">
                      <span>Cables & Wiring</span>
                      <strong>{formatCurrency(calculatedCosts.cableCost)}</strong>
                    </div>
                  </div>
                  <small className="form-hint">These are estimated based on standard installation requirements</small>
                </div>

                {/* Additional Equipment */}
                <div className="quotation-section">
                  <h4>Additional Equipment</h4>
                  <button type="button" className="btn-add-item" onClick={addAdditionalEquipment}>
                    <FaPlus /> Add Item
                  </button>

                  {additionalEquipment.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <input
                        type="text"
                        placeholder="Item name"
                        value={item.name}
                        onChange={(e) => updateAdditionalEquipment(index, 'name', e.target.value)}
                      />
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => updateAdditionalEquipment(index, 'quantity', parseInt(e.target.value) || 0)}
                        style={{ width: '80px' }}
                      />
                      <input
                        type="number"
                        placeholder="Price"
                        value={item.price}
                        onChange={(e) => updateAdditionalEquipment(index, 'price', parseFloat(e.target.value) || 0)}
                        style={{ width: '120px' }}
                      />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeAdditionalEquipment(index)}>
                        <FaTrash />
                      </button>
                    </div>
                  ))}
                </div>

                {/* Labor & Installation */}
                <div className="quotation-section">
                  <h4><FaHardHat /> Installation Labor</h4>
                  <div className="labor-calculation">
                    <div className="labor-detail">
                      <span>Per kW installation ({quotationForm.systemSize || 0} kW x ₱{config?.laborRates?.perKw || 5000})</span>
                      <span>{formatCurrency((quotationForm.systemSize || 0) * (config?.laborRates?.perKw || 5000))}</span>
                    </div>
                    <div className="labor-detail">
                      <span>Per panel installation ({panelQuantity} panels x ₱{config?.laborRates?.perPanel || 1000})</span>
                      <span>{formatCurrency(panelQuantity * (config?.laborRates?.perPanel || 1000))}</span>
                    </div>
                    <div className="labor-total">
                      <strong>Total Labor Cost</strong>
                      <strong>{formatCurrency(calculatedCosts.installationLaborCost)}</strong>
                    </div>
                  </div>
                </div>

                {/* Cost Summary */}
                <div className="cost-summary-large">
                  <h3>Cost Summary</h3>
                  <div className="summary-row">
                    <span>Equipment Total:</span>
                    <span>{formatCurrency(calculatedCosts.totalEquipmentCost)}</span>
                  </div>
                  <div className="summary-row">
                    <span>Installation Labor:</span>
                    <span>{formatCurrency(calculatedCosts.installationLaborCost)}</span>
                  </div>
                  <div className="summary-row total">
                    <span>TOTAL SYSTEM COST:</span>
                    <span>{formatCurrency(calculatedCosts.totalSystemCost)}</span>
                  </div>

                  {quotationForm.paymentTerms && (
                    <div className="payment-terms">
                      <strong>Payment Terms:</strong>
                      <p>{quotationForm.paymentTerms}</p>
                    </div>
                  )}
                </div>

                {/* Payment Terms Input */}
                <div className="form-group-enad">
                  <label>Payment Terms</label>
                  <textarea
                    value={quotationForm.paymentTerms}
                    onChange={(e) => handleQuotationChange('paymentTerms', e.target.value)}
                    rows={3}
                    placeholder="e.g., 30% down payment, 70% upon completion"
                  />
                </div>

                {/* Action Buttons */}
                <div className="action-buttons-enad" style={{ marginTop: '20px' }}>
                  <button
                    onClick={generateQuotationPDF}
                    disabled={generatingPDF || !quotationForm.systemSize || calculatedCosts.totalSystemCost === 0}
                    className="btn-primary-enad"
                  >
                    {generatingPDF ? <FaSpinner className="spinner-enad" /> : <FaFilePdf />} Generate & Upload PDF
                  </button>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <div className="action-buttons-enad">
                  <button onClick={() => setShowImageUploader(!showImageUploader)} className="btn-primary-enad">
                    <FaCamera /> Upload Photos
                  </button>
                </div>

                {showImageUploader && (
                  <div className="file-upload-enad">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      disabled={uploading}
                      className="file-upload-input-enad"
                    />
                    {uploading && (
                      <div className="uploading-enad">
                        <FaSpinner className="spinner-enad" /> Uploading images...
                      </div>
                    )}
                  </div>
                )}

                <div className="image-grid-enad">
                  {siteImages.map((image, idx) => (
                    <div key={idx} className="image-card-enad">
                      <img src={image} alt={`Site photo ${idx + 1}`} />
                      <div className="image-overlay-enad">
                        <a href={image} target="_blank" rel="noopener noreferrer" className="image-overlay-icon-enad">
                          <FaEye />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>

                {siteImages.length === 0 && (
                  <div className="empty-state-enad">
                    <FaImages className="empty-icon-enad" />
                    <p>No photos uploaded yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                <div className="comment-input-wrapper-enad">
                  <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder="Add a comment..."
                    rows={3}
                    className="comment-textarea-enad"
                  />
                  <button
                    onClick={addComment}
                    disabled={submitting || !commentText.trim()}
                    className="comment-send-btn-enad"
                  >
                    <FaPaperPlane /> Send
                  </button>
                </div>

                <div className="comment-list-enad">
                  {selectedItem.engineerComments?.length === 0 && (
                    <div className="empty-state-enad">
                      <p>No comments yet</p>
                    </div>
                  )}
                  {selectedItem.engineerComments?.map((comment, idx) => (
                    <div key={idx} className="comment-item-enad">
                      <div className="comment-header-enad">
                        <div className="comment-user-enad">
                          <div className="comment-avatar-enad">
                            <FaUser />
                          </div>
                          <div>
                            <p className="comment-name-enad">{comment.commentedBy?.firstName} {comment.commentedBy?.lastName}</p>
                            <p className="comment-time-enad">{formatDateTime(comment.commentedAt)}</p>
                          </div>
                        </div>
                        {comment.isPublic && <span className="comment-badge-enad">Public</span>}
                      </div>
                      <p className="comment-text-enad">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MyAssessments;