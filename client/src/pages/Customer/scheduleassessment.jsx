// pages/Customer/ScheduleAssessment.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Helmet } from 'react-helmet-async';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import {
  FaTimes,
  FaChevronLeft,
  FaChevronRight,
  FaDownload,
  FaImages,
  FaEye,
  FaLightbulb,
  FaSun,
  FaMoon,
  FaPlug,
  FaTrash,
  FaPlus,
  FaSave,
  FaMoneyBillWave,
  FaHome,
  FaFileInvoice,
  FaCheckCircle,
  FaSpinner,
  FaArrowLeft,
  FaCalendarAlt,
  FaUserCircle,
  FaMapMarkerAlt,
  FaClock,
  FaFilter,
  FaSearch,
  FaSolarPanel
} from 'react-icons/fa';
import '../../styles/Customer/scheduleassessment.css';

const ScheduleAssessment = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState('service-selection');
  const [submitted, setSubmitted] = useState(false);
  const [submittedData, setSubmittedData] = useState(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestFilter, setRequestFilter] = useState('all');
  const [hasPendingFreeQuote, setHasPendingFreeQuote] = useState(false);

  // Quotation states
  const [showQuotationModal, setShowQuotationModal] = useState(false);
  const [selectedQuotation, setSelectedQuotation] = useState(null);
  const [acceptingQuotation, setAcceptingQuotation] = useState(null);
  const [selectedPaymentPreference, setSelectedPaymentPreference] = useState('installment');
  const [acceptingLoading, setAcceptingLoading] = useState(false);

  // Photo Gallery States
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  // Electric Bill Input States
  const [electricBillInput, setElectricBillInput] = useState({
    monthlyBill: '',
    ratePerKwh: '',
    monthlyKwh: ''
  });

  // Appliances States
  const [appliances, setAppliances] = useState([]);
  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState(null);
  const [applianceForm, setApplianceForm] = useState({
    name: '',
    powerWatts: '',
    quantity: '',
    dayHours: '',
    nightHours: ''
  });
  const [applianceErrors, setApplianceErrors] = useState({});

  // Calculation Results
  const [calculationResults, setCalculationResults] = useState({
    totalDailyConsumption: 0,
    dayConsumption: 0,
    nightConsumption: 0,
    dayPercentage: 0,
    nightPercentage: 0,
    monthlyConsumption: 0
  });

  const SYSTEM_TYPES = [
    { value: 'grid-tie', label: 'Grid-Tie System', description: 'Connected to utility grid, no batteries' },
    { value: 'hybrid', label: 'Hybrid System', description: 'Grid-tie with battery backup' },
    { value: 'off-grid', label: 'Off-Grid System', description: 'Standalone with batteries, not connected to grid' }
  ];

  // Free Quote Data
  const [freeQuoteData, setFreeQuoteData] = useState({
    monthlyBill: '',
    propertyType: 'residential',
    systemType: '',
    roofType: '',
    roofLength: '',
    roofWidth: '',
    targetSavings: ''
  });
  const [showFreeQuoteConfirm, setShowFreeQuoteConfirm] = useState(false);
  const [freeQuoteTermsAccepted, setFreeQuoteTermsAccepted] = useState(false);
  const [freeQuoteValidationErrors, setFreeQuoteValidationErrors] = useState({});

  const [showPreAssessmentSuccess, setShowPreAssessmentSuccess] = useState(false);
  const [preAssessmentData, setPreAssessmentData] = useState(null);

  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    contactNumber: '',
    propertyType: 'residential',
    systemType: '',
    roofType: '',
    roofLength: '',
    roofWidth: '',
    paymentMethod: 'gcash',
    targetSavings: ''
  });
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const [freeQuotes, setFreeQuotes] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);
  const [projects, setProjects] = useState([]);

  // Calculate consumption based on appliances only
  const calculateConsumption = () => {
    let totalDayWatts = 0;
    let totalNightWatts = 0;

    appliances.forEach(appliance => {
      const applianceDayWatts = appliance.powerWatts * appliance.quantity * appliance.dayHours;
      const applianceNightWatts = appliance.powerWatts * appliance.quantity * appliance.nightHours;
      totalDayWatts += applianceDayWatts;
      totalNightWatts += applianceNightWatts;
    });

    const dayKwh = totalDayWatts / 1000;
    const nightKwh = totalNightWatts / 1000;
    const totalKwhFromAppliances = dayKwh + nightKwh;

    let dayPercent = 0;
    let nightPercent = 0;

    if (totalKwhFromAppliances > 0) {
      dayPercent = (dayKwh / totalKwhFromAppliances) * 100;
      nightPercent = (nightKwh / totalKwhFromAppliances) * 100;
    }

    // Monthly consumption = total daily * 30 days
    const monthlyKwh = totalKwhFromAppliances * 30;

    setCalculationResults({
      totalDailyConsumption: totalKwhFromAppliances,
      dayConsumption: dayKwh,
      nightConsumption: nightKwh,
      dayPercentage: dayPercent,
      nightPercentage: nightPercent,
      monthlyConsumption: monthlyKwh
    });

    // Auto-populate the monthly Kwh field with the calculated value
    if (totalKwhFromAppliances > 0) {
      setElectricBillInput(prev => ({
        ...prev,
        monthlyKwh: monthlyKwh.toFixed(2)
      }));
    } else {
      setElectricBillInput(prev => ({
        ...prev,
        monthlyKwh: ''
      }));
    }
  };

  useEffect(() => {
    if (appliances.length > 0) {
      calculateConsumption();
    } else {
      setCalculationResults({
        totalDailyConsumption: 0,
        dayConsumption: 0,
        nightConsumption: 0,
        dayPercentage: 0,
        nightPercentage: 0,
        monthlyConsumption: 0
      });
      setElectricBillInput(prev => ({
        ...prev,
        monthlyKwh: ''
      }));
    }
  }, [appliances]);

  const handleElectricBillChange = (e) => {
    const { name, value } = e.target;
    setElectricBillInput(prev => ({ ...prev, [name]: value }));
  };

  const handleApplianceFormChange = (e) => {
    const { name, value } = e.target;
    setApplianceForm(prev => ({ ...prev, [name]: value }));
    // Clear error for this field when user types
    if (applianceErrors[name]) {
      setApplianceErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateApplianceForm = () => {
    const errors = {};
    if (!applianceForm.name) {
      errors.name = 'Appliance name is required';
    }
    if (!applianceForm.powerWatts) {
      errors.powerWatts = 'Power rating is required';
    } else if (parseFloat(applianceForm.powerWatts) <= 0) {
      errors.powerWatts = 'Power must be greater than 0';
    }
    if (!applianceForm.quantity) {
      errors.quantity = 'Quantity is required';
    } else if (parseInt(applianceForm.quantity) <= 0) {
      errors.quantity = 'Quantity must be at least 1';
    }
    if (applianceForm.dayHours && (parseFloat(applianceForm.dayHours) < 0 || parseFloat(applianceForm.dayHours) > 12)) {
      errors.dayHours = 'Day hours must be between 0 and 12';
    }
    if (applianceForm.nightHours && (parseFloat(applianceForm.nightHours) < 0 || parseFloat(applianceForm.nightHours) > 12)) {
      errors.nightHours = 'Night hours must be between 0 and 12';
    }
    return errors;
  };

  const saveAppliance = () => {
    const errors = validateApplianceForm();
    if (Object.keys(errors).length > 0) {
      setApplianceErrors(errors);
      showToast('Please fix the errors in the form', 'warning');
      return;
    }

    const newAppliance = {
      id: editingAppliance?.id || Date.now(),
      name: applianceForm.name,
      powerWatts: parseFloat(applianceForm.powerWatts),
      quantity: parseInt(applianceForm.quantity),
      dayHours: Math.min(Math.max(parseFloat(applianceForm.dayHours) || 0, 0), 12),
      nightHours: Math.min(Math.max(parseFloat(applianceForm.nightHours) || 0, 0), 12)
    };

    if (editingAppliance) {
      setAppliances(prev => prev.map(a => a.id === editingAppliance.id ? newAppliance : a));
      showToast('Appliance updated successfully', 'success');
    } else {
      setAppliances(prev => [...prev, newAppliance]);
      showToast('Appliance added successfully', 'success');
    }

    setShowApplianceModal(false);
    setEditingAppliance(null);
    setApplianceForm({ name: '', powerWatts: '', quantity: '', dayHours: '', nightHours: '' });
    setApplianceErrors({});
  };

  const editAppliance = (appliance) => {
    setEditingAppliance(appliance);
    setApplianceForm({
      name: appliance.name,
      powerWatts: appliance.powerWatts,
      quantity: appliance.quantity,
      dayHours: appliance.dayHours,
      nightHours: appliance.nightHours
    });
    setApplianceErrors({});
    setShowApplianceModal(true);
  };

  const deleteAppliance = (id) => {
    if (window.confirm('Are you sure you want to remove this appliance?')) {
      setAppliances(prev => prev.filter(a => a.id !== id));
      showToast('Appliance removed', 'info');
    }
  };

  const clearAppliances = () => {
    setAppliances([]);
    setElectricBillInput({
      monthlyBill: '',
      ratePerKwh: '',
      monthlyKwh: ''
    });
    setCalculationResults({
      totalDailyConsumption: 0,
      dayConsumption: 0,
      nightConsumption: 0,
      dayPercentage: 0,
      nightPercentage: 0,
      monthlyConsumption: 0
    });
  };

  const openPhotoModal = (photos, index) => {
    setSelectedPhotos(photos);
    setCurrentPhotoIndex(index);
    setShowPhotoModal(true);
  };

  const closePhotoModal = () => {
    setShowPhotoModal(false);
    setSelectedPhotos([]);
    setCurrentPhotoIndex(0);
  };

  const nextPhoto = () => {
    if (selectedPhotos && currentPhotoIndex < selectedPhotos.length - 1) {
      setCurrentPhotoIndex(currentPhotoIndex + 1);
    }
  };

  const prevPhoto = () => {
    if (selectedPhotos && currentPhotoIndex > 0) {
      setCurrentPhotoIndex(currentPhotoIndex - 1);
    }
  };

  const downloadPhoto = async (url, index) => {
    try {
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'image/jpeg' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `site-photo-${index + 1}.jpg`;
      link.click();
      URL.revokeObjectURL(link.href);
      showToast('Photo downloaded successfully', 'success');
    } catch (error) {
      console.error('Error downloading photo:', error);
      showToast('Failed to download photo', 'error');
    }
  };

  useEffect(() => {
    fetchClientData();
    fetchClientAddresses();
    fetchMyRequests();
    fetchProjects();
  }, []);

  const fetchClientData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('Please log in to continue');
        setLoading(false);
        return;
      }
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const clientData = response.data?.client;
      if (clientData) {
        setUser(clientData);
        let propertyType = 'residential';
        if (clientData.client_type === 'Company') propertyType = 'commercial';
        if (clientData.client_type === 'Industrial') propertyType = 'industrial';
        setFormData(prev => ({
          ...prev,
          firstName: clientData?.contactFirstName || '',
          middleName: clientData?.contactMiddleName || '',
          lastName: clientData?.contactLastName || '',
          contactNumber: clientData?.contactNumber || '',
          propertyType: propertyType
        }));
      }
    } catch (err) {
      setError('Failed to load your information');
    } finally {
      setLoading(false);
    }
  };

  const fetchClientAddresses = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me/addresses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const fetchedAddresses = response.data?.addresses || [];
      setAddresses(fetchedAddresses);
      if (fetchedAddresses.length > 0) {
        const primaryAddress = fetchedAddresses.find(addr => addr.isPrimary) || fetchedAddresses[0];
        setSelectedAddress(primaryAddress);
      }
    } catch (err) {
      console.error('Error fetching addresses:', err);
    }
  };

  const fetchProjects = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(response.data.projects || []);
    } catch (err) {
      console.error('Error fetching projects:', err);
    }
  };

  const fetchMyRequests = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const [freeQuotesRes, preAssessmentsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes/my-quotes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-bookings`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const assessments = preAssessmentsRes.data.assessments || [];
      const quotes = freeQuotesRes.data.quotes || [];

      const hasPending = quotes.some(quote =>
        quote.status === 'pending' ||
        quote.status === 'assigned' ||
        quote.status === 'processing'
      );

      setHasPendingFreeQuote(hasPending);

      const assessmentsWithEngineer = await Promise.all(assessments.map(async (assessment) => {
        let engineerName = 'Not assigned yet';
        let engineerId = null;

        if (assessment.assignedEngineerId) {
          if (typeof assessment.assignedEngineerId === 'object') {
            engineerId = assessment.assignedEngineerId._id || assessment.assignedEngineerId.id;
          } else if (typeof assessment.assignedEngineerId === 'string') {
            engineerId = assessment.assignedEngineerId;
          }
        }

        if (engineerId) {
          try {
            const engineerRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/admin/users/${engineerId}`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            const engineer = engineerRes.data.user;
            if (engineer) {
              engineerName = engineer.fullName ||
                (engineer.firstName && engineer.lastName ? `${engineer.firstName} ${engineer.lastName}` : null) ||
                engineer.name ||
                engineer.email ||
                'Engineer assigned';
            }
          } catch (err) {
            console.error(`Error fetching engineer:`, err);
            engineerName = 'Engineer assigned';
          }
        }

        return {
          ...assessment,
          engineerName,
          sitePhotos: assessment.sitePhotos || []
        };
      }));

      setFreeQuotes(quotes);
      setPreAssessments(assessmentsWithEngineer);
    } catch (err) {
      console.error('Error fetching requests:', err);
    }
  };

  // ============ QUOTATION HANDLERS ============

  const handleViewQuotation = (assessment) => {
    const url = assessment.finalQuotation || assessment.quotation?.quotationUrl;
    if (!url) {
      showToast('No quotation PDF available', 'warning');
      return;
    }
    window.open(url, '_blank');
  };

  const handleDownloadQuotation = async (assessment) => {
    const url = assessment.finalQuotation || assessment.quotation?.quotationUrl;
    if (!url) {
      showToast('No quotation PDF available', 'warning');
      return;
    }
    try {
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Quotation_${assessment.bookingReference || 'assessment'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      showToast('Quotation downloaded successfully!', 'success');
    } catch (err) {
      console.error('Error downloading quotation:', err);
      showToast('Failed to download quotation', 'error');
    }
  };

  // ============ FREE QUOTE QUOTATION HANDLERS ============

  const handleViewFreeQuoteQuotation = (quote) => {
    const url = quote.quotationFile || quote.quotationUrl;
    if (!url) {
      showToast('No quotation PDF available', 'warning');
      return;
    }
    window.open(url, '_blank');
  };

  const handleDownloadFreeQuoteQuotation = async (quote) => {
    const url = quote.quotationFile || quote.quotationUrl;
    if (!url) {
      showToast('No quotation PDF available', 'warning');
      return;
    }
    try {
      const response = await axios.get(url, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `Quotation_${quote.quotationReference || 'free-quote'}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      showToast('Quotation downloaded successfully!', 'success');
    } catch (err) {
      console.error('Error downloading quotation:', err);
      showToast('Failed to download quotation', 'error');
    }
  };

  const handleAcceptFreeQuoteClick = (quote) => {
    const systemSize = quote.recommendedSystemSize ||
      quote.desiredCapacity ||
      quote.quotationDetails?.systemSize ||
      5;

    const totalCost = quote.quotationDetails?.totalCost ||
      quote.quotationDetails?.systemCost ||
      quote.estimatedTotalCost ||
      quote.quotationDetails?.equipmentCost + quote.quotationDetails?.installationCost ||
      0;

    const systemType = quote.systemType ||
      quote.quotationDetails?.systemType ||
      'grid-tie';

    const panelsNeeded = quote.panelsNeeded ||
      quote.quotationDetails?.panelsNeeded ||
      Math.ceil(systemSize / 0.55);

    const equipmentBreakdown = quote.quotationDetails?.equipmentBreakdown || null;

    const inverterType = equipmentBreakdown?.inverter?.name ||
      quote.quotationDetails?.inverterType ||
      null;

    const batteryType = equipmentBreakdown?.battery?.name ||
      quote.quotationDetails?.batteryType ||
      null;

    setAcceptingQuotation({
      _id: quote._id,
      sourceType: 'free-quote',
      quotationReference: quote.quotationReference,
      quote: quote,
      quotation: {
        systemDetails: {
          systemSize: systemSize,
          totalCost: totalCost,
          systemType: systemType,
          panelsNeeded: panelsNeeded,
          inverterType: inverterType,
          batteryType: batteryType,
          equipmentBreakdown: equipmentBreakdown,
          installationCost: quote.quotationDetails?.installationCost || 0,
          equipmentCost: quote.quotationDetails?.equipmentCost || 0
        }
      },
      assessmentFee: totalCost || 0
    });

    setSelectedPaymentPreference('installment');
    setCurrentStep('accept-quotation');
  };

  // ============ ACCEPT QUOTATION (UNIFIED) ============

  const handleAcceptQuotationClick = (assessment) => {
    setAcceptingQuotation({
      _id: assessment._id,
      sourceType: 'pre-assessment',
      quotationReference: assessment.bookingReference,
      quotation: assessment.quotation,
      assessmentFee: assessment.assessmentFee || 0
    });
    setSelectedPaymentPreference('installment');
    setCurrentStep('accept-quotation');
  };

  const confirmAcceptQuotation = async () => {
    if (!acceptingQuotation) return;
    setAcceptingLoading(true);
    try {
      const token = sessionStorage.getItem('token');

      const sourceType = acceptingQuotation.sourceType || 'pre-assessment';
      const sourceId = acceptingQuotation._id;

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/projects/accept`,
        {
          sourceType: sourceType,
          sourceId: sourceId,
          paymentPreference: selectedPaymentPreference
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Quotation accepted successfully! Project created.', 'success');
      setCurrentStep('my-requests');
      setAcceptingQuotation(null);
      fetchMyRequests();
      fetchProjects();
    } catch (err) {
      console.error('Error accepting quotation:', err);
      showToast(err.response?.data?.message || 'Failed to accept quotation', 'error');
    } finally {
      setAcceptingLoading(false);
    }
  };

  // ============ FREE QUOTE FUNCTIONS ============

  // Validate Free Quote Form
  const validateFreeQuoteForm = () => {
    const errors = {};
    if (!freeQuoteData.monthlyBill) {
      errors.monthlyBill = 'Monthly electricity bill is required';
    }
    if (!freeQuoteData.propertyType) {
      errors.propertyType = 'Property type is required';
    }
    if (appliances.length === 0) {
      errors.appliances = 'Please add at least one appliance';
    }
    if (!selectedAddress) {
      errors.address = 'Please select an address';
    }
    return errors;
  };

  // Handle Free Quote Submit - goes to confirmation
  const handleFreeQuoteSubmit = () => {
    const errors = validateFreeQuoteForm();
    if (Object.keys(errors).length > 0) {
      setFreeQuoteValidationErrors(errors);
      showToast('Please complete all required fields', 'warning');
      return;
    }
    setShowFreeQuoteConfirm(true);
  };

  // Confirm and submit Free Quote
  const confirmFreeQuote = async () => {
    if (!freeQuoteTermsAccepted) {
      showToast('Please accept the terms and conditions to proceed', 'warning');
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');

      const quotePayload = {
        clientId: user?._id,
        addressId: selectedAddress?._id || null,
        monthlyBill: freeQuoteData.monthlyBill,
        propertyType: freeQuoteData.propertyType,
        systemType: freeQuoteData.systemType,
        roofType: freeQuoteData.roofType,
        roofLength: freeQuoteData.roofLength,
        roofWidth: freeQuoteData.roofWidth,
        targetSavings: freeQuoteData.targetSavings,
        monthlyConsumption: calculationResults.monthlyConsumption,
        rate: electricBillInput.ratePerKwh,
        appliances: appliances.map(app => ({
          name: app.name,
          powerWatts: app.powerWatts,
          quantity: app.quantity,
          dayHours: app.dayHours,
          nightHours: app.nightHours
        })),
        dayConsumption: calculationResults.dayConsumption,
        nightConsumption: calculationResults.nightConsumption,
        dayPercentage: calculationResults.dayPercentage,
        nightPercentage: calculationResults.nightPercentage,
        totalDailyConsumption: calculationResults.totalDailyConsumption
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/free-quotes`,
        quotePayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await sendQuoteConfirmationEmail(
        response.data.quote.quotationReference,
        freeQuoteData.monthlyBill,
        freeQuoteData.propertyType,
        freeQuoteData.systemType,
        freeQuoteData.roofType,
        freeQuoteData.roofLength,
        freeQuoteData.roofWidth,
        freeQuoteData.targetSavings,
        calculationResults.monthlyConsumption,
        appliances,
        getFullAddress()
      );

      setShowFreeQuoteConfirm(false);
      setFreeQuoteTermsAccepted(false);
      setSubmittedData({
        reference: response.data.quote.quotationReference,
        type: 'free-quote',
        systemCalculations: {
          recommendedSystemSize: response.data.quote.recommendedSystemSize,
          inverterSize: response.data.quote.inverterSize,
          batteryCapacityKwh: response.data.quote.batteryCapacityKwh,
          panelsNeeded: response.data.quote.panelsNeeded
        }
      });
      setCurrentStep('service-selection');
      setSubmitted(true);
      showToast('Quote request submitted successfully!', 'success');
      fetchMyRequests();
      setIsSubmitting(false);
    } catch (err) {
      console.error('Error submitting quote:', err);
      showToast(err.response?.data?.message || 'Failed to submit quote request. Please try again.', 'error');
      setIsSubmitting(false);
    }
  };

  // Send quote confirmation email
  const sendQuoteConfirmationEmail = async (
    quoteReference,
    monthlyBill,
    propertyType,
    systemType,
    roofType,
    roofLength,
    roofWidth,
    targetSavings,
    monthlyConsumption,
    appliancesList,
    address
  ) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/email/send-free-quote-confirmation`, {
        email: user.email,
        name: getFullName(),
        quoteReference,
        monthlyBill,
        propertyType,
        systemType,
        roofType,
        roofLength,
        roofWidth,
        targetSavings,
        monthlyConsumption,
        appliances: appliancesList,
        address
      });
    } catch (emailError) {
      console.error('Failed to send quote confirmation email:', emailError);
    }
  };

  // ============ PRE ASSESSMENT FUNCTIONS ============

  const sendPreAssessmentConfirmationEmail = async (invoiceNumber, amount, propertyType, roofType, address) => {
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/email/send-pre-assessment-confirmation`, {
        email: user.email,
        name: getFullName(),
        invoiceNumber,
        amount,
        propertyType,
        roofType,
        address
      });
    } catch (emailError) {
      console.error('Failed to send pre-assessment confirmation email:', emailError);
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.propertyType) errors.propertyType = 'Property type is required';
    if (!selectedAddress) errors.address = 'Please select an address';
    if (appliances.length === 0) errors.appliances = 'Please add at least one appliance';
    return errors;
  };

  const handleSubmitClick = () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      showToast('Please complete all required fields', 'warning');
      return;
    }
    setShowConfirmDialog(true);
  };

  const handleConfirmBooking = async () => {
    if (!termsAccepted) {
      showToast('Please accept the terms and conditions to proceed', 'warning');
      return;
    }
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      const bookingPayload = {
        clientId: user?._id,
        addressId: selectedAddress?._id || null,
        propertyType: formData.propertyType,
        systemType: formData.systemType,
        roofType: formData.roofType,
        roofLength: formData.roofLength,
        roofWidth: formData.roofWidth,
        monthlyBill: electricBillInput.monthlyBill,
        rate: electricBillInput.ratePerKwh,
        consumption: calculationResults.monthlyConsumption,
        dayConsumption: calculationResults.dayConsumption,
        nightConsumption: calculationResults.nightConsumption,
        dayPercentage: calculationResults.dayPercentage,
        nightPercentage: calculationResults.nightPercentage,
        totalDailyConsumption: calculationResults.totalDailyConsumption,
        targetSavings: formData.targetSavings ? parseInt(formData.targetSavings) : null
      };

      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments`, bookingPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await sendPreAssessmentConfirmationEmail(
        response.data.booking.invoiceNumber,
        response.data.booking.assessmentFee,
        formData.propertyType,
        formData.roofType,
        getFullAddress()
      );

      setShowConfirmDialog(false);
      setTermsAccepted(false);
      setPreAssessmentData({
        reference: response.data.booking.bookingReference,
        invoiceNumber: response.data.booking.invoiceNumber
      });
      setShowPreAssessmentSuccess(true);
      showToast('Pre-assessment booked successfully!', 'success');
      fetchMyRequests();
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to submit pre-assessment. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddressClick = () => navigate('/app/customer/settings?tab=addresses');
  const handleProfileClick = () => navigate('/app/customer/settings?tab=profile');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (currentStep === 'free-quote-form') {
      setFreeQuoteData(prev => ({ ...prev, [name]: value }));
      if (freeQuoteValidationErrors[name]) {
        setFreeQuoteValidationErrors(prev => ({ ...prev, [name]: '' }));
      }
    } else if (currentStep === 'service-selection') {
      setFreeQuoteData(prev => ({ ...prev, [name]: value }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
      if (validationErrors[name]) setValidationErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const getFullName = () => [formData.firstName, formData.middleName, formData.lastName].filter(p => p).join(' ');

  const getFullAddress = () => {
    if (selectedAddress) {
      return `${selectedAddress.houseOrBuilding} ${selectedAddress.street}, ${selectedAddress.barangay}, ${selectedAddress.cityMunicipality}, ${selectedAddress.province} ${selectedAddress.zipCode}`;
    }
    return '';
  };

  const getAddressDisplay = () => {
    if (!selectedAddress) return null;
    return {
      fullAddress: getFullAddress(),
      houseOrBuilding: selectedAddress.houseOrBuilding,
      street: selectedAddress.street,
      barangay: selectedAddress.barangay,
      cityMunicipality: selectedAddress.cityMunicipality,
      province: selectedAddress.province,
      zipCode: selectedAddress.zipCode
    };
  };

  const getRequestAddress = (request) => {
    let address = null;
    if (request.address && typeof request.address === 'object') address = request.address;
    else if (request.addressId && typeof request.addressId === 'object') address = request.addressId;
    else if (request.address && typeof request.address === 'string') return request.address;
    if (address) {
      const parts = [address.houseOrBuilding, address.street, address.barangay, address.cityMunicipality, address.province, address.zipCode].filter(part => part && part.trim());
      return parts.length > 0 ? parts.join(', ') : 'Address not available';
    }
    return 'Address not available';
  };

  const formatCurrency = (value) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value || 0);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getSystemTypeLabel = (value) => {
    const type = SYSTEM_TYPES.find(t => t.value === value);
    return type ? type.label : 'Not specified';
  };

  const getAssessmentStatusBadge = (status) => {
    const badges = {
      'pending_review': <span className="status-badge-schedule pending-review">Pending Review</span>,
      'pending_payment': <span className="status-badge-schedule pending-payment">Pending Payment</span>,
      'for_verification': <span className="status-badge-schedule for-verification">For Verification</span>,
      'paid': <span className="status-badge-schedule paid">Paid</span>,
      'scheduled': <span className="status-badge-schedule scheduled">Scheduled</span>,
      'site_visit_ongoing': <span className="status-badge-schedule site-visit">Site Visit</span>,
      'device_deployed': <span className="status-badge-schedule device-deployed">Device Deployed</span>,
      'data_collecting': <span className="status-badge-schedule data-collecting">Collecting</span>,
      'data_analyzing': <span className="status-badge-schedule data-analyzing">Analyzing</span>,
      'report_draft': <span className="status-badge-schedule report-draft">Report Draft</span>,
      'completed': <span className="status-badge-schedule completed">Completed</span>,
      'cancelled': <span className="status-badge-schedule cancelled">Cancelled</span>,
      'quotation_accepted': <span className="status-badge-schedule quotation-accepted">Quotation Accepted</span>
    };
    return badges[status] || <span className="status-badge-schedule">{status}</span>;
  };

  const getFreeQuoteStatusBadge = (status) => {
    const badges = {
      'pending': <span className="status-badge-schedule pending">Pending</span>,
      'assigned': <span className="status-badge-schedule assigned">Assigned</span>,
      'processing': <span className="status-badge-schedule processing">Processing</span>,
      'completed': <span className="status-badge-schedule completed">Completed</span>,
      'accepted': <span className="status-badge-schedule quotation-accepted">Accepted</span>,
      'cancelled': <span className="status-badge-schedule cancelled">Cancelled</span>
    };
    return badges[status] || <span className="status-badge-schedule">{status}</span>;
  };

  const viewQuotation = (quotationUrl) => {
    if (quotationUrl) window.open(quotationUrl, '_blank');
    else showToast('No quotation PDF available yet.', 'info');
  };

  const addressDisplay = getAddressDisplay();

  const getFilteredRequests = () => {
    if (requestFilter === 'free-quotes') return { freeQuotes, preAssessments: [] };
    if (requestFilter === 'pre-assessments') return { freeQuotes: [], preAssessments };
    return { freeQuotes, preAssessments };
  };

  const { freeQuotes: filteredFreeQuotes, preAssessments: filteredPreAssessments } = getFilteredRequests();
  const hasRequests = freeQuotes.length > 0 || preAssessments.length > 0;
  const totalRequests = freeQuotes.length + preAssessments.length;

  const SkeletonLoader = () => (
    <div className="schedule-container-cusset">
      <div className="schedule-header-card-cusset skeleton-card">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line small"></div>
      </div>
      <div className="service-selection-grid-cusset">
        <div className="skeleton-service-card"></div>
        <div className="skeleton-service-card"></div>
      </div>
    </div>
  );

  // ============ RENDER MY REQUESTS PAGE ============
  if (currentStep === 'my-requests') {
    return (
      <>
        <Helmet><title>My Requests | Salfer Engineering</title></Helmet>
        <div className="schedule-container-cusset">
          <div className="back-button-container-cusset">
            <button onClick={() => setCurrentStep('service-selection')} className="back-to-services-cusset">
              <FaArrowLeft /> Back to Services
            </button>
          </div>

          <div className="requests-page-header-cusset">
            <div className="requests-page-title-cusset">
              <h1>My Requests</h1>
              <p>View all your free quotation and pre-assessment requests</p>
            </div>
            <div className="requests-page-stats-cusset">
              <span className="stat-badge-cusset">
                <FaFileInvoice /> {freeQuotes.length} Free Quotes
              </span>
              <span className="stat-badge-cusset">
                <FaCalendarAlt /> {preAssessments.length} Pre-Assessments
              </span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="request-filter-tabs-page-cusset">
            <button 
              className={`filter-tab-page-cusset ${requestFilter === 'all' ? 'active' : ''}`} 
              onClick={() => setRequestFilter('all')}
            >
              All ({totalRequests})
            </button>
            <button 
              className={`filter-tab-page-cusset ${requestFilter === 'free-quotes' ? 'active' : ''}`} 
              onClick={() => setRequestFilter('free-quotes')}
            >
              Free Quotes ({freeQuotes.length})
            </button>
            <button 
              className={`filter-tab-page-cusset ${requestFilter === 'pre-assessments' ? 'active' : ''}`} 
              onClick={() => setRequestFilter('pre-assessments')}
            >
              Pre Assessments ({preAssessments.length})
            </button>
          </div>

          {/* Requests List */}
          <div className="requests-list-page-cusset">
            {!hasRequests ? (
              <div className="empty-requests-page-cusset">
                <FaFileInvoice className="empty-icon-cusset" />
                <h3>No requests yet</h3>
                <p>Start your solar journey by requesting a free quotation or booking a pre-assessment.</p>
                <button 
                  className="schedule-btn-primary-cusset" 
                  onClick={() => setCurrentStep('service-selection')}
                >
                  Get Started
                </button>
              </div>
            ) : (
              <>
                {/* Free Quotes */}
                {filteredFreeQuotes.map(quote => {
                  const hasQuotation = quote.quotationFile || quote.quotationUrl;
                  const isAccepted = quote.status === 'accepted';
                  const alreadyProjectCreated = projects.some(p => {
                    if (p.sourceType === 'free-quote' && p.sourceId) {
                      const projectSourceId = typeof p.sourceId === 'object' ?
                        p.sourceId._id?.toString() : p.sourceId?.toString();
                      return projectSourceId === quote._id?.toString();
                    }
                    return false;
                  });

                  return (
                    <div key={quote._id} className="request-card-page-cusset">
                      <div className="request-card-header-cusset">
                        <div className="request-card-title-cusset">
                          <span className="type-badge-page free-quote">Free Quote</span>
                          <span className="request-reference-cusset">{quote.quotationReference}</span>
                        </div>
                        <div className="request-card-status-cusset">
                          {getFreeQuoteStatusBadge(quote.status)}
                        </div>
                      </div>

                      <div className="request-card-body-cusset">
                        <div className="request-details-grid-cusset">
                          <div><span>Monthly Bill:</span> <strong>{formatCurrency(quote.monthlyBill)}</strong></div>
                          <div><span>Property Type:</span> <strong>{quote.propertyType}</strong></div>
                          {quote.systemType && <div><span>System Type:</span> <strong>{getSystemTypeLabel(quote.systemType)}</strong></div>}
                          {quote.targetSavings && <div><span>Target Savings:</span> <strong>{quote.targetSavings}%</strong></div>}
                          {quote.recommendedSystemSize && <div><span>System Size:</span> <strong>{quote.recommendedSystemSize} kW</strong></div>}
                          <div><span>Date:</span> <strong>{formatDate(quote.requestedAt)}</strong></div>
                          <div className="full-width"><span>Address:</span> <strong>{getRequestAddress(quote)}</strong></div>
                        </div>

                        {hasQuotation && (
                          <div className="request-card-actions-cusset">
                            <button
                              className="btn-action-page view-quote"
                              onClick={() => handleViewFreeQuoteQuotation(quote)}
                            >
                              <FaEye /> View Quote
                            </button>
                            <button
                              className="btn-action-page download-quote"
                              onClick={() => handleDownloadFreeQuoteQuotation(quote)}
                            >
                              <FaDownload /> Download
                            </button>
                            {!isAccepted && !alreadyProjectCreated && quote.status !== 'cancelled' && (
                              <button
                                className="btn-action-page accept-quote"
                                onClick={() => handleAcceptFreeQuoteClick(quote)}
                              >
                                <FaCheckCircle /> Accept
                              </button>
                            )}
                            {(isAccepted || alreadyProjectCreated) && (
                              <span className="project-created-badge-page">
                                <FaCheckCircle /> Project Created
                              </span>
                            )}
                          </div>
                        )}
                        {!hasQuotation && quote.status !== 'cancelled' && (
                          <div className="request-card-actions-cusset">
                            <span className="status-badge-schedule processing">Waiting for Quotation</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Pre Assessments */}
                {filteredPreAssessments.map(assessment => {
                  const hasPhotos = assessment.sitePhotos && assessment.sitePhotos.length > 0;
                  const hasQuotation = assessment.finalQuotation || assessment.quotation?.quotationUrl;
                  const alreadyProjectCreated = assessment.assessmentStatus === 'quotation_accepted' ||
                    projects.some(p => {
                      if (p.preAssessmentId) {
                        const projectPreAssessmentId = typeof p.preAssessmentId === 'object' ?
                          p.preAssessmentId._id?.toString() : p.preAssessmentId?.toString();
                        return projectPreAssessmentId === assessment._id?.toString();
                      }
                      return false;
                    });

                  return (
                    <div key={assessment._id} className="request-card-page-cusset">
                      <div className="request-card-header-cusset">
                        <div className="request-card-title-cusset">
                          <span className="type-badge-page pre-assessment">Pre Assessment</span>
                          <span className="request-reference-cusset">{assessment.bookingReference}</span>
                        </div>
                        <div className="request-card-status-cusset">
                          {getAssessmentStatusBadge(assessment.assessmentStatus || assessment.paymentStatus)}
                        </div>
                      </div>

                      <div className="request-card-body-cusset">
                        <div className="request-details-grid-cusset">
                          <div><span>Property Type:</span> <strong>{assessment.propertyType}</strong></div>
                          <div><span>Monthly Bill:</span> <strong>{formatCurrency(assessment.monthlyBill)}</strong></div>
                          <div><span>Fee:</span> <strong>{formatCurrency(assessment.assessmentFee)}</strong></div>
                          {assessment.targetSavings && <div><span>Target Savings:</span> <strong>{assessment.targetSavings}%</strong></div>}
                          <div><span>Engineer:</span> <strong>{assessment.engineerName || 'Not assigned yet'}</strong></div>
                          <div className="full-width"><span>Address:</span> <strong>{getRequestAddress(assessment)}</strong></div>
                        </div>

                        {/* Site Photos */}
                        {hasPhotos && (
                          <div className="request-card-photos-cusset">
                            <div className="photos-preview-cusset">
                              {assessment.sitePhotos.slice(0, 4).map((photo, idx) => (
                                <div
                                  key={idx}
                                  className="photo-preview-item-cusset"
                                  onClick={() => openPhotoModal(assessment.sitePhotos, idx)}
                                >
                                  <img src={photo} alt={`Site photo ${idx + 1}`} />
                                  <div className="photo-preview-overlay-cusset"><FaEye /></div>
                                </div>
                              ))}
                              {assessment.sitePhotos.length > 4 && (
                                <div
                                  className="photo-preview-item-cusset more"
                                  onClick={() => openPhotoModal(assessment.sitePhotos, 0)}
                                >
                                  <FaImages />
                                  <span>+{assessment.sitePhotos.length - 4}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {hasQuotation && (
                          <div className="request-card-actions-cusset">
                            <button
                              className="btn-action-page view-quote"
                              onClick={() => handleViewQuotation(assessment)}
                            >
                              <FaEye /> View Quote
                            </button>
                            <button
                              className="btn-action-page download-quote"
                              onClick={() => handleDownloadQuotation(assessment)}
                            >
                              <FaDownload /> Download
                            </button>
                            {!alreadyProjectCreated && assessment.assessmentStatus !== 'quotation_accepted' && (
                              <button
                                className="btn-action-page accept-quote"
                                onClick={() => handleAcceptQuotationClick(assessment)}
                              >
                                <FaCheckCircle /> Accept
                              </button>
                            )}
                            {alreadyProjectCreated && (
                              <span className="project-created-badge-page">
                                <FaCheckCircle /> Project Created
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        </div>

        {/* Photo Modal */}
        {showPhotoModal && selectedPhotos.length > 0 && (
          <div className="photo-modal-overlay-cusset" onClick={closePhotoModal}>
            <div className="photo-modal-content-cusset" onClick={(e) => e.stopPropagation()}>
              <button className="photo-modal-close-cusset" onClick={closePhotoModal}><FaTimes /></button>
              <div className="photo-modal-main-cusset">
                <img src={selectedPhotos[currentPhotoIndex]} alt={`Site photo ${currentPhotoIndex + 1}`} />
                {selectedPhotos.length > 1 && (
                  <>
                    <button className="photo-nav-cusset prev" onClick={prevPhoto} disabled={currentPhotoIndex === 0}><FaChevronLeft /></button>
                    <button className="photo-nav-cusset next" onClick={nextPhoto} disabled={currentPhotoIndex === selectedPhotos.length - 1}><FaChevronRight /></button>
                  </>
                )}
              </div>
              <div className="photo-modal-footer-cusset">
                <div className="photo-counter-cusset">{currentPhotoIndex + 1} / {selectedPhotos.length}</div>
                <button className="photo-download-btn-cusset" onClick={() => downloadPhoto(selectedPhotos[currentPhotoIndex], currentPhotoIndex)}>
                  <FaDownload /> Download
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </>
    );
  }

  // ============ RENDER ACCEPT QUOTATION PAGE ============
  if (currentStep === 'accept-quotation' && acceptingQuotation) {
    return (
      <>
        <Helmet><title>Accept Quotation | Salfer Engineering</title></Helmet>
        <div className="schedule-container-cusset">
          <div className="back-button-container-cusset">
            <button 
              onClick={() => {
                setCurrentStep('my-requests');
                setAcceptingQuotation(null);
              }} 
              className="back-to-services-cusset"
            >
              <FaArrowLeft /> Back to My Requests
            </button>
          </div>

          <div className="accept-quotation-page-cusset">
            <div className="accept-quotation-header-cusset">
              <h1>Accept Quotation</h1>
              <p>Review the quotation details and choose your payment preference</p>
              <span className="source-badge-page" style={{ 
                background: acceptingQuotation.sourceType === 'free-quote' ? '#4CAF50' : '#2196F3',
                color: '#fff',
                padding: '4px 16px',
                borderRadius: '20px',
                fontSize: '13px',
                display: 'inline-block',
                marginTop: '8px'
              }}>
                {acceptingQuotation.sourceType === 'free-quote' ? 'Free Quote' : 'Pre-Assessment'}
              </span>
            </div>

            <div className="accept-quotation-content-cusset">
              {/* Quotation Summary */}
              <div className="quotation-summary-page-cusset">
                <h3>Quotation Summary</h3>
                <div className="summary-grid-cusset">
                  <div className="summary-item-cusset">
                    <span>Reference:</span>
                    <strong>{acceptingQuotation.quotationReference || 'N/A'}</strong>
                  </div>
                  <div className="summary-item-cusset">
                    <span>System Size:</span>
                    <strong>{acceptingQuotation.quotation?.systemDetails?.systemSize || 'TBD'} kWp</strong>
                  </div>
                  <div className="summary-item-cusset">
                    <span>Total Cost:</span>
                    <strong className="total-cost-cusset">{formatCurrency(acceptingQuotation.quotation?.systemDetails?.totalCost || acceptingQuotation.assessmentFee)}</strong>
                  </div>
                  <div className="summary-item-cusset">
                    <span>System Type:</span>
                    <strong>{acceptingQuotation.quotation?.systemDetails?.systemType || 'Not specified'}</strong>
                  </div>
                  <div className="summary-item-cusset">
                    <span>Panels Needed:</span>
                    <strong>{acceptingQuotation.quotation?.systemDetails?.panelsNeeded || 'TBD'}</strong>
                  </div>
                  {acceptingQuotation.quotation?.systemDetails?.inverterType && (
                    <div className="summary-item-cusset">
                      <span>Inverter Type:</span>
                      <strong>{acceptingQuotation.quotation.systemDetails.inverterType}</strong>
                    </div>
                  )}
                  {acceptingQuotation.quotation?.systemDetails?.batteryType && (
                    <div className="summary-item-cusset">
                      <span>Battery Type:</span>
                      <strong>{acceptingQuotation.quotation.systemDetails.batteryType}</strong>
                    </div>
                  )}
                </div>

                {/* Equipment Breakdown */}
                {acceptingQuotation.quotation?.systemDetails?.equipmentBreakdown && (
                  <div className="equipment-breakdown-cusset">
                    <h4>Equipment Breakdown</h4>
                    <div className="equipment-grid-cusset">
                      {acceptingQuotation.quotation.systemDetails.equipmentBreakdown.panels && (
                        <div className="equipment-item-cusset">
                          <span>Panels:</span>
                          <strong>{acceptingQuotation.quotation.systemDetails.equipmentBreakdown.panels.quantity} × {acceptingQuotation.quotation.systemDetails.equipmentBreakdown.panels.wattage}W</strong>
                        </div>
                      )}
                      {acceptingQuotation.quotation.systemDetails.equipmentBreakdown.inverter && (
                        <div className="equipment-item-cusset">
                          <span>Inverter:</span>
                          <strong>{acceptingQuotation.quotation.systemDetails.equipmentBreakdown.inverter.name}</strong>
                        </div>
                      )}
                      {acceptingQuotation.quotation.systemDetails.equipmentBreakdown.battery && (
                        <div className="equipment-item-cusset">
                          <span>Battery:</span>
                          <strong>{acceptingQuotation.quotation.systemDetails.equipmentBreakdown.battery.name}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Payment Preference */}
              <div className="payment-preference-page-cusset">
                <h3>Choose Payment Option</h3>
                <div className="preference-options-page-cusset">
                  {/* 50% - 50% Installment */}
                  <div
                    className={`preference-option-page ${selectedPaymentPreference === 'fifty_fifty' ? 'selected' : ''}`}
                    onClick={() => setSelectedPaymentPreference('fifty_fifty')}
                  >
                    <input type="radio" checked={selectedPaymentPreference === 'fifty_fifty'} readOnly />
                    <div className="preference-content-page">
                      <strong>50% - 50% Installment</strong>
                      <div className="preference-details-page">
                        <span>Downpayment (50%): {formatCurrency((acceptingQuotation.quotation?.systemDetails?.totalCost || acceptingQuotation.assessmentFee) * 0.5)}</span>
                        <span>Final Payment (50%): {formatCurrency((acceptingQuotation.quotation?.systemDetails?.totalCost || acceptingQuotation.assessmentFee) * 0.5)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 30% - 60% - 10% with Retention */}
                  <div
                    className={`preference-option-page ${selectedPaymentPreference === 'thirty_sixty_ten' ? 'selected' : ''}`}
                    onClick={() => setSelectedPaymentPreference('thirty_sixty_ten')}
                  >
                    <input type="radio" checked={selectedPaymentPreference === 'thirty_sixty_ten'} readOnly />
                    <div className="preference-content-page">
                      <strong>Installment with Retention (30% - 60% - 10%)</strong>
                      <div className="preference-details-page">
                        <span>Downpayment (30%): {formatCurrency((acceptingQuotation.quotation?.systemDetails?.totalCost || acceptingQuotation.assessmentFee) * 0.3)}</span>
                        <span>Progress Payment (60%): {formatCurrency((acceptingQuotation.quotation?.systemDetails?.totalCost || acceptingQuotation.assessmentFee) * 0.6)}</span>
                        <span className="retention-note-page">Retention Fee (10%): {formatCurrency((acceptingQuotation.quotation?.systemDetails?.totalCost || acceptingQuotation.assessmentFee) * 0.1)}</span>
                      </div>
                    </div>
                  </div>

                  {/* 30% - 40% - 30% Installment */}
                  <div
                    className={`preference-option-page ${selectedPaymentPreference === 'installment' ? 'selected' : ''}`}
                    onClick={() => setSelectedPaymentPreference('installment')}
                  >
                    <input type="radio" checked={selectedPaymentPreference === 'installment'} readOnly />
                    <div className="preference-content-page">
                      <strong>Installment (30% - 40% - 30%)</strong>
                      <div className="preference-details-page">
                        <span>Initial (30%): {formatCurrency((acceptingQuotation.quotation?.systemDetails?.totalCost || acceptingQuotation.assessmentFee) * 0.3)}</span>
                        <span>Progress (40%): {formatCurrency((acceptingQuotation.quotation?.systemDetails?.totalCost || acceptingQuotation.assessmentFee) * 0.4)}</span>
                        <span>Final (30%): {formatCurrency((acceptingQuotation.quotation?.systemDetails?.totalCost || acceptingQuotation.assessmentFee) * 0.3)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Full Payment */}
                  <div
                    className={`preference-option-page ${selectedPaymentPreference === 'full' ? 'selected' : ''}`}
                    onClick={() => setSelectedPaymentPreference('full')}
                  >
                    <input type="radio" checked={selectedPaymentPreference === 'full'} readOnly />
                    <div className="preference-content-page">
                      <strong>Full Payment</strong>
                      <div className="preference-details-page full-payment-page">
                        <span>Amount: {formatCurrency(acceptingQuotation.quotation?.systemDetails?.totalCost || acceptingQuotation.assessmentFee)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="accept-quotation-actions-cusset">
                <button 
                  className="cancel-btn-page-cusset" 
                  onClick={() => {
                    setCurrentStep('my-requests');
                    setAcceptingQuotation(null);
                  }}
                >
                  Cancel
                </button>
                <button
                  className="confirm-btn-page-cusset"
                  onClick={confirmAcceptQuotation}
                  disabled={acceptingLoading}
                >
                  {acceptingLoading ? <FaSpinner className="spinning" /> : 'Accept Quotation'}
                  {acceptingLoading ? ' Processing...' : ''}
                </button>
              </div>
            </div>
          </div>
        </div>

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </>
    );
  }

  if (loading) return <><Helmet><title>Get Solar Service | Salfer Engineering</title></Helmet><SkeletonLoader /></>;

  if (error) return (
    <div className="schedule-error-container-cusset">
      <h2>Something went wrong</h2>
      <p>{error}</p>
      <div className="schedule-error-actions-cusset">
        <button onClick={fetchClientData} className="schedule-btn-primary-cusset">Try Again</button>
        <button onClick={() => window.location.href = '/login'} className="schedule-btn-secondary-cusset">Go to Login</button>
      </div>
    </div>
  );

  if (submitted) return (
    <div className="schedule-container-cusset">
      <div className="schedule-confirmation-card-cusset">
        <div className="confirmation-icon">✓</div>
        <h1>Request Submitted!</h1>
        {submittedData?.type === 'free-quote' && (
          <>
            <p>Your quotation request has been received.</p>
            <div className="schedule-booking-details-cusset">
              <p><strong>Reference Number:</strong> {submittedData.reference}</p>
              <p><strong>Status:</strong> Pending Review</p>
            </div>

           

            <div className="schedule-next-steps-cusset">
              <h3>What's Next?</h3>
              <ul>
                <li>Our team will review your request</li>
                <li>You'll receive a detailed quotation via email</li>
                <li>Our engineer may contact you for additional information</li>
              </ul>
            </div>
          </>
        )}
        <div className="quote-actions-cusset">
          <button
            onClick={() => {
              setSubmitted(false);
              setCurrentStep('service-selection');
              setFreeQuoteData({ monthlyBill: '', propertyType: 'residential', systemType: '', roofType: '', roofLength: '', roofWidth: '', targetSavings: '' });
              clearAppliances();
              setSubmittedData(null);
              setFreeQuoteTermsAccepted(false);
            }}
            className="schedule-btn-secondary-cusset"
          >
            Request Another
          </button>
          <button onClick={() => navigate('/app/customer')} className="schedule-btn-primary-cusset">Go to Dashboard</button>
        </div>
      </div>
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
    </div>
  );

  if (showPreAssessmentSuccess) return (
    <div className="schedule-container-cusset">
      <div className="schedule-confirmation-card-cusset">
        <div className="confirmation-icon">✓</div>
        <h1>Pre-Assessment Booked!</h1>
        <p>Your pre-assessment request has been successfully submitted.</p>
        <div className="schedule-booking-details-cusset">
          <p><strong>Booking Reference:</strong> {preAssessmentData?.reference}</p>
          <p><strong>Invoice Number:</strong> {preAssessmentData?.invoiceNumber}</p>
          <p><strong>Status:</strong> Pending Admin Confirmation</p>
        </div>
        <div className="schedule-next-steps-cusset">
          <h3>What's Next?</h3>
          <ul>
            <li>Our admin will review your booking request</li>
            <li>Once confirmed, you will receive payment instructions</li>
            <li>After payment verification, an engineer will be assigned to your assessment</li>
          </ul>
        </div>
        <div className="quote-actions-cusset">
          <button onClick={() => { setShowPreAssessmentSuccess(false); setCurrentStep('service-selection'); setFormData({ ...formData, systemType: '', roofType: '', roofLength: '', roofWidth: '', targetSavings: '' }); clearAppliances(); }} className="schedule-btn-secondary-cusset">Book Another</button>
          <button onClick={() => navigate('/app/customer')} className="schedule-btn-primary-cusset">Go to Dashboard</button>
        </div>
      </div>
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
    </div>
  );

  // ============ SERVICE SELECTION PAGE ============
  if (currentStep === 'service-selection') {
    return (
      <>
        <Helmet><title>Get Solar Service | Salfer Engineering</title></Helmet>
        <div className="schedule-container-cusset">
          <div className="schedule-header-card-cusset">
            <div className="schedule-header-content-cusset">
              <h1 className="schedule-title-cusset">Get Your Solar Solution</h1>
              <p className="schedule-subtitle-cusset">Choose how you want to proceed with your solar journey</p>
            </div>
            <div className="schedule-header-action-cusset">
              <button className="view-requests-btn-cusset" onClick={() => setCurrentStep('my-requests')}>
                View My Requests {totalRequests > 0 && <span className="request-count">{totalRequests}</span>}
              </button>
            </div>
          </div>

          <div className="service-selection-grid-cusset">
            {/* Free Quote Card */}
            <div className="service-card-cusset">
              <div className="service-card-header-cusset">
                <h2>Free Quotation</h2>
                <span className="service-badge-cusset free-cusset">Free</span>
              </div>
              <p className="service-description-cusset">Request a free quotation for your solar system. Our team will review and provide a detailed estimate.</p>
              <ul className="service-features-cusset">
                <li>Enter your monthly electricity bill</li>
                <li>List your appliances with usage hours</li>
                <li>Automatic day/night consumption calculation</li>
                <li>Get a preliminary system size recommendation</li>
                <li>Receive a detailed quotation</li>
              </ul>
              <div className="card-button-container-cusset">
                <button
                  className="btn-get-quote-cusset"
                  onClick={() => {
                    setCurrentStep('free-quote-form');
                    setFreeQuoteValidationErrors({});
                    setFreeQuoteTermsAccepted(false);
                  }}
                >
                  Get Free Quote
                </button>
              </div>
            </div>

            {/* Pre Assessment Card */}
            <div className="service-card-cusset paid-cusset">
              <div className="service-card-header-cusset">
                <h2>Pre Assessment</h2>
                <span className="service-badge-cusset paid-cusset">₱1,500</span>
              </div>
              <p className="service-description-cusset">Professional on-site assessment with detailed energy consumption analysis and accurate system sizing.</p>
              <ul className="service-features-cusset">
                <li>List your appliances with day and night usage hours</li>
                <li>Automatic day/night calculation from appliances</li>
                <li>7-day environmental data collection</li>
                <li>Accurate system size recommendation</li>
              </ul>
              <div className="card-button-container-cusset">
                <button
                  className="btn-paid-assessment-cusset"
                  onClick={() => setCurrentStep('pre-assessment-form')}
                >
                  Book Pre Assessment
                </button>
              </div>
            </div>
          </div>
        </div>

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </>
    );
  }

  // ============ FREE QUOTE FORM PAGE ============
  if (currentStep === 'free-quote-form') {
    return (
      <>
        <Helmet><title>Free Quotation | Salfer Engineering</title></Helmet>
        <div className="schedule-container-cusset">
          <div className="back-button-container-cusset">
            <button onClick={() => {
              setCurrentStep('service-selection');
              setFreeQuoteValidationErrors({});
              setFreeQuoteTermsAccepted(false);
            }} className="back-to-services-cusset">
              ← Back to Services
            </button>
          </div>

          <div className="form-page-header-cusset">
            <h1 className="form-page-title-cusset">Free Quotation</h1>
            <p className="form-page-subtitle-cusset">Complete the form below to request your free solar quotation</p>
          </div>

          {hasPendingFreeQuote && (
            <div className="pending-warning-cusset">
              <svg style={{ marginRight: '8px', width: '14px', height: '14px' }} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
              You already have a pending quotation request. Please wait for it to be processed before requesting another.
            </div>
          )}

          <div className="form-main-card-cusset">
            {/* Contact and Address Section */}
            <div className="form-section-cusset">
              <div className="form-section-header-cusset">
                <div className="form-section-icon-cusset">
                  <FaUserCircle />
                </div>
                <div className="form-section-title-group-cusset">
                  <h3>Contact and Address Information</h3>
                  <p>Your personal and location details</p>
                </div>
              </div>
              <div className="form-section-body-cusset">
                <div className="combined-info-card-cusset" onClick={() => setShowInfoModal(true)}>
                  <div className="combined-info-header-cusset">
                    <div className="combined-info-content-cusset">
                      <div className="combined-info-name-cusset">{getFullName() || 'Not provided'}</div>
                      <div className="combined-info-contact-cusset">{formData.contactNumber || 'Not provided'}</div>
                      <div className="combined-info-address-cusset">{getFullAddress() || 'No address selected'}</div>
                    </div>
                  </div>
                  <div className="combined-info-hint-cusset">Click to view full details and manage settings</div>
                </div>
                {freeQuoteValidationErrors.address && (
                  <div className="error-message-cusset" style={{ marginTop: '10px' }}>{freeQuoteValidationErrors.address}</div>
                )}
              </div>
            </div>

            {/* ============ APPLIANCES SECTION ============ */}
            <div className="form-section-cusset">
              <div className="form-section-header-cusset">
                <div className="form-section-icon-cusset">
                  <FaPlug />
                </div>
                <div className="form-section-title-group-cusset">
                  <h3>Your Appliances *</h3>
                  <p>List all your electrical devices with their usage hours (0-12 hours each)</p>
                </div>
              </div>
              <div className="form-section-body-cusset">
                <div className="appliances-section-cusset">
                  <div className="appliances-header-cusset">
                    <span className="appliances-count-cusset">{appliances.length} appliances added</span>
                    <button
                      type="button"
                      className="add-appliance-btn-cusset"
                      onClick={() => {
                        setEditingAppliance(null);
                        setApplianceForm({ name: '', powerWatts: '', quantity: '', dayHours: '', nightHours: '' });
                        setApplianceErrors({});
                        setShowApplianceModal(true);
                      }}
                    >
                      <FaPlus /> Add Appliance
                    </button>
                  </div>

                  {freeQuoteValidationErrors.appliances && (
                    <div className="error-message-cusset">{freeQuoteValidationErrors.appliances}</div>
                  )}

                  {appliances.length === 0 ? (
                    <div className="empty-appliances-cusset">
                      <FaLightbulb />
                      <p>No appliances added yet.</p>
                      <small>Click "Add Appliance" to list your electrical devices like air conditioning, refrigerator, lighting, etc.</small>
                    </div>
                  ) : (
                    <div className="appliances-table-container-cusset">
                      <table className="appliances-table-cusset">
                        <thead>
                          <tr>
                            <th>Appliance</th>
                            <th>Power (W)</th>
                            <th>Qty</th>
                            <th>Day Hours</th>
                            <th>Night Hours</th>
                            <th>Day Energy (kWh)</th>
                            <th>Night Energy (kWh)</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appliances.map(appliance => {
                            const dayEnergy = (appliance.powerWatts * appliance.quantity * appliance.dayHours) / 1000;
                            const nightEnergy = (appliance.powerWatts * appliance.quantity * appliance.nightHours) / 1000;
                            return (
                              <tr key={appliance.id}>
                                <td><strong>{appliance.name}</strong></td>
                                <td>{appliance.powerWatts} W</td>
                                <td>{appliance.quantity}</td>
                                <td>{appliance.dayHours} hrs</td>
                                <td>{appliance.nightHours} hrs</td>
                                <td>{dayEnergy.toFixed(2)} kWh</td>
                                <td>{nightEnergy.toFixed(2)} kWh</td>
                                <td>
                                  <button className="edit-appliance-btn" onClick={() => editAppliance(appliance)}>
                                    <FaEye /> Edit
                                  </button>
                                  <button className="delete-appliance-btn" onClick={() => deleteAppliance(appliance.id)}>
                                    <FaTrash /> Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Consumption Results */}
                {appliances.length > 0 && (
                  <div className="consumption-results-cusset">
                    <h4>Your Energy Profile</h4>
                    <div className="results-grid-cusset">
                      <div className="result-card-cusset day-result">
                        <FaSun className="result-icon" />
                        <div className="result-info">
                          <span className="result-label">Day Consumption</span>
                          <span className="result-value">{calculationResults.dayConsumption?.toFixed(2) || 0} kWh</span>
                          <span className="result-percentage">({calculationResults.dayPercentage?.toFixed(1) || 0}%)</span>
                        </div>
                      </div>
                      <div className="result-card-cusset night-result">
                        <FaMoon className="result-icon" />
                        <div className="result-info">
                          <span className="result-label">Night Consumption</span>
                          <span className="result-value">{calculationResults.nightConsumption?.toFixed(2) || 0} kWh</span>
                          <span className="result-percentage">({calculationResults.nightPercentage?.toFixed(1) || 0}%)</span>
                        </div>
                      </div>
                      <div className="result-card-cusset total-result">
                        <FaLightbulb className="result-icon" />
                        <div className="result-info">
                          <span className="result-label">Total Daily</span>
                          <span className="result-value">{calculationResults.totalDailyConsumption?.toFixed(2) || 0} kWh/day</span>
                          <small>Based on appliance usage only</small>
                        </div>
                      </div>
                      <div className="result-card-cusset monthly-result" style={{ background: '#e8f5e9', borderColor: '#4caf50' }}>
                        <FaFileInvoice className="result-icon" />
                        <div className="result-info">
                          <span className="result-label">Monthly Consumption</span>
                          <span className="result-value">{calculationResults.monthlyConsumption?.toFixed(2) || 0} kWh</span>
                          <small>Total Daily × 30 days</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {appliances.length === 0 && (
                  <div className="info-message-cusset">
                    <p>Please add at least one appliance to calculate your energy consumption.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ============ ASSESSMENT DETAILS ============ */}
            <div className="form-section-cusset">
              <div className="form-section-header-cusset">
                <div className="form-section-icon-cusset">
                  <FaHome />
                </div>
                <div className="form-section-title-group-cusset">
                  <h3>Assessment Details</h3>
                  <p>Tell us about your property and system preferences</p>
                </div>
              </div>
              <div className="form-section-body-cusset">
                <div className="schedule-form-grid-cusset">
                  <div className="schedule-form-group-cusset">
                    <label>Monthly Electricity Bill (₱) *</label>
                    <input
                      type="number"
                      step="0.01"
                      name="monthlyBill"
                      value={freeQuoteData.monthlyBill}
                      onChange={handleInputChange}
                      placeholder="e.g., 5000"
                      className={`schedule-form-input-cusset ${freeQuoteValidationErrors.monthlyBill ? 'error' : ''}`}
                    />
                    {freeQuoteValidationErrors.monthlyBill && (
                      <div className="error-message-cusset">{freeQuoteValidationErrors.monthlyBill}</div>
                    )}
                    <small>Your average monthly electricity bill amount</small>
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Property Type *</label>
                    <select
                      name="propertyType"
                      value={freeQuoteData.propertyType}
                      onChange={handleInputChange}
                      className={`schedule-form-select-cusset ${freeQuoteValidationErrors.propertyType ? 'error' : ''}`}
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                    </select>
                    {freeQuoteValidationErrors.propertyType && (
                      <div className="error-message-cusset">{freeQuoteValidationErrors.propertyType}</div>
                    )}
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Rate per kWh (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="ratePerKwh"
                      value={electricBillInput.ratePerKwh}
                      onChange={handleElectricBillChange}
                      placeholder="e.g., 11.50"
                      className="schedule-form-input-cusset"
                    />
                    <small>Check your electric bill for the rate (optional)</small>
                  </div>
                </div>

                <div className="schedule-form-grid-cusset" style={{ marginTop: '16px' }}>
                  <div className="schedule-form-group-cusset">
                    <label>Preferred System Type</label>
                    <select
                      name="systemType"
                      value={freeQuoteData.systemType}
                      onChange={handleInputChange}
                      className="schedule-form-select-cusset"
                    >
                      <option value="">Select (optional)</option>
                      {SYSTEM_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Target Savings (%)</label>
                    <select
                      name="targetSavings"
                      value={freeQuoteData.targetSavings}
                      onChange={handleInputChange}
                      className="schedule-form-select-cusset"
                    >
                      <option value="">Select target savings (optional)</option>
                      <option value="100">100% - Fully offset my bill</option>
                      <option value="75">75% - Significant reduction</option>
                      <option value="50">50% - Balanced approach</option>
                      <option value="25">25% - Basic savings</option>
                    </select>
                    <small>Help us size your system based on your savings goal</small>
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Roof Type</label>
                    <select
                      name="roofType"
                      value={freeQuoteData.roofType}
                      onChange={handleInputChange}
                      className="schedule-form-select-cusset"
                    >
                      <option value="">Select (optional)</option>
                      <option value="concrete">Concrete</option>
                      <option value="metal">Metal</option>
                      <option value="tile">Tile</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="schedule-form-group-cusset" style={{ gridColumn: '1 / -1' }}>
                    <label>Roof Dimensions</label>
                    <div className="dimension-row-cusset">
                      <input
                        type="number"
                        step="0.1"
                        name="roofLength"
                        value={freeQuoteData.roofLength}
                        onChange={handleInputChange}
                        placeholder="Length (m)"
                        className="schedule-form-input-cusset"
                      />
                      <input
                        type="number"
                        step="0.1"
                        name="roofWidth"
                        value={freeQuoteData.roofWidth}
                        onChange={handleInputChange}
                        placeholder="Width (m)"
                        className="schedule-form-input-cusset"
                      />
                    </div>
                  </div>
                </div>

                <div className="schedule-fee-card-cusset">
                  <div className="fee-card-icon-cusset">
                    <FaFileInvoice />
                  </div>
                  <div className="fee-card-content-cusset">
                    <strong>Free Quotation</strong>
                    <p>This is a complimentary service. Our team will review your information and provide a detailed quotation via email.</p>
                    <small>Includes: Energy consumption analysis, system size recommendation, and cost estimate.</small>
                  </div>
                </div>

                <div className="form-actions-cusset">
                  <button
                    onClick={handleFreeQuoteSubmit}
                    className="schedule-btn-submit-cusset"
                    disabled={hasPendingFreeQuote || appliances.length === 0}
                  >
                    {hasPendingFreeQuote ? 'Request in Progress' : 'Review and Submit Quote Request'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Appliance Modal */}
          {showApplianceModal && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowApplianceModal(false)}>
              <div className="schedule-modal-cusset appliance-modal-cusset" onClick={e => e.stopPropagation()}>
                <div className="modal-header-cusset">
                  <h3>{editingAppliance ? 'Edit Appliance' : 'Add Appliance'}</h3>
                  <button className="modal-close-cusset" onClick={() => setShowApplianceModal(false)}>×</button>
                </div>
                <div className="modal-body-cusset">
                  <div className="schedule-form-group-cusset">
                    <label>Appliance Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={applianceForm.name}
                      onChange={handleApplianceFormChange}
                      placeholder="e.g., Air Conditioner, Refrigerator, TV"
                      className={`schedule-form-input-cusset ${applianceErrors.name ? 'error' : ''}`}
                    />
                    {applianceErrors.name && (
                      <div className="error-message-cusset">{applianceErrors.name}</div>
                    )}
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Power Rating (Watts) *</label>
                    <input
                      type="number"
                      name="powerWatts"
                      value={applianceForm.powerWatts}
                      onChange={handleApplianceFormChange}
                      placeholder="e.g., 1500"
                      className={`schedule-form-input-cusset ${applianceErrors.powerWatts ? 'error' : ''}`}
                    />
                    {applianceErrors.powerWatts && (
                      <div className="error-message-cusset">{applianceErrors.powerWatts}</div>
                    )}
                    <small>Check the label on your appliance for watts (W)</small>
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={applianceForm.quantity}
                      onChange={handleApplianceFormChange}
                      placeholder="e.g., 2"
                      className={`schedule-form-input-cusset ${applianceErrors.quantity ? 'error' : ''}`}
                    />
                    {applianceErrors.quantity && (
                      <div className="error-message-cusset">{applianceErrors.quantity}</div>
                    )}
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Day Usage Hours (0-12) *</label>
                    <input
                      type="number"
                      step="0.5"
                      name="dayHours"
                      value={applianceForm.dayHours}
                      onChange={handleApplianceFormChange}
                      placeholder="e.g., 8"
                      className={`schedule-form-input-cusset ${applianceErrors.dayHours ? 'error' : ''}`}
                      min="0"
                      max="12"
                    />
                    {applianceErrors.dayHours && (
                      <div className="error-message-cusset">{applianceErrors.dayHours}</div>
                    )}
                    <small>Hours used during daytime (0-12 hours, 6 AM - 6 PM)</small>
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Night Usage Hours (0-12) *</label>
                    <input
                      type="number"
                      step="0.5"
                      name="nightHours"
                      value={applianceForm.nightHours}
                      onChange={handleApplianceFormChange}
                      placeholder="e.g., 4"
                      className={`schedule-form-input-cusset ${applianceErrors.nightHours ? 'error' : ''}`}
                      min="0"
                      max="12"
                    />
                    {applianceErrors.nightHours && (
                      <div className="error-message-cusset">{applianceErrors.nightHours}</div>
                    )}
                    <small>Hours used during nighttime (0-12 hours, 6 PM - 6 AM)</small>
                  </div>
                </div>
                <div className="modal-actions-cusset">
                  <button className="cancel-btn-cusset" onClick={() => setShowApplianceModal(false)}>Cancel</button>
                  <button className="save-btn-cusset" onClick={saveAppliance}>
                    <FaSave /> {editingAppliance ? 'Update' : 'Add'} Appliance
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Modal */}
          {showInfoModal && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowInfoModal(false)}>
              <div className="schedule-modal-cusset info-modal-cusset" onClick={e => e.stopPropagation()}>
                <div className="info-modal-header-cusset"><h3>Contact and Address Details</h3></div>
                <div className="info-modal-body-cusset">
                  <div className="info-section-cusset">
                    <h4>Personal Information</h4>
                    <div className="info-details-cusset">
                      <div className="info-row-cusset"><span>Full Name:</span><span>{getFullName() || 'Not provided'}</span></div>
                      <div className="info-row-cusset"><span>Contact:</span><span>{formData.contactNumber || 'Not provided'}</span></div>
                      {user?.email && <div className="info-row-cusset"><span>Email:</span><span>{user.email}</span></div>}
                    </div>
                    <button className="info-action-btn-cusset" onClick={handleProfileClick}>Edit Profile</button>
                  </div>
                  <div className="info-section-cusset">
                    <h4>Address Information</h4>
                    {addressDisplay ? (
                      <div className="info-details-cusset">
                        <div className="info-row-cusset"><span>House/Building:</span><span>{addressDisplay.houseOrBuilding}</span></div>
                        <div className="info-row-cusset"><span>Street:</span><span>{addressDisplay.street}</span></div>
                        <div className="info-row-cusset"><span>Barangay:</span><span>{addressDisplay.barangay}</span></div>
                        <div className="info-row-cusset"><span>City:</span><span>{addressDisplay.cityMunicipality}</span></div>
                        <div className="info-row-cusset"><span>Province:</span><span>{addressDisplay.province}</span></div>
                      </div>
                    ) : <p>No address selected</p>}
                    <button className="info-action-btn-cusset" onClick={handleAddressClick}>Change Address</button>
                  </div>
                </div>
                <div className="info-modal-footer-cusset"><button className="info-close-btn-cusset" onClick={() => setShowInfoModal(false)}>Close</button></div>
              </div>
            </div>
          )}

          {/* Free Quote Confirmation Dialog */}
          {showFreeQuoteConfirm && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowFreeQuoteConfirm(false)}>
              <div className="schedule-modal-cusset" onClick={e => e.stopPropagation()}>
                <h2>Confirm Quotation Request</h2>
                <div className="schedule-modal-summary-cusset">
                  <div className="schedule-summary-section-cusset">
                    <h4>Contact</h4>
                    <p><strong>Name:</strong> {getFullName()}</p>
                    <p><strong>Contact:</strong> {formData.contactNumber}</p>
                  </div>
                  <div className="schedule-summary-section-cusset">
                    <h4>Address</h4>
                    <p>{getFullAddress()}</p>
                  </div>
                  <div className="schedule-summary-section-cusset">
                    <h4>Energy Profile</h4>
                    <p><strong>Monthly Bill:</strong> {formatCurrency(freeQuoteData.monthlyBill)}</p>
                    <p><strong>Monthly Consumption:</strong> {calculationResults.monthlyConsumption?.toFixed(2) || electricBillInput.monthlyKwh} kWh</p>
                    <p><strong>Total Daily:</strong> {calculationResults.totalDailyConsumption.toFixed(2)} kWh</p>
                    <p><strong>Day/Night:</strong> {calculationResults.dayPercentage.toFixed(0)}% / {calculationResults.nightPercentage.toFixed(0)}%</p>
                    <p><strong>Appliances:</strong> {appliances.length} items</p>
                  </div>
                  <div className="schedule-summary-section-cusset">
                    <h4>System Preferences</h4>
                    <p><strong>Property:</strong> {freeQuoteData.propertyType}</p>
                    {freeQuoteData.systemType && (
                      <p><strong>System Type:</strong> {SYSTEM_TYPES.find(t => t.value === freeQuoteData.systemType)?.label}</p>
                    )}
                    {freeQuoteData.targetSavings && (
                      <p><strong>Target Savings:</strong> {freeQuoteData.targetSavings}%</p>
                    )}
                    {freeQuoteData.roofType && (
                      <p><strong>Roof Type:</strong> {freeQuoteData.roofType}</p>
                    )}
                    {freeQuoteData.roofLength && freeQuoteData.roofWidth && (
                      <p><strong>Roof Dimensions:</strong> {freeQuoteData.roofLength}m × {freeQuoteData.roofWidth}m</p>
                    )}
                  </div>
                </div>
                <div className="schedule-modal-checkbox-cusset">
                  <label>
                    <input
                      type="checkbox"
                      checked={freeQuoteTermsAccepted}
                      onChange={(e) => setFreeQuoteTermsAccepted(e.target.checked)}
                    />
                    <span>I agree to the <a href="/terms" target="_blank" className="terms-link">Terms and Conditions</a></span>
                  </label>
                </div>
                <div className="schedule-modal-actions-cusset">
                  <button
                    onClick={() => {
                      setShowFreeQuoteConfirm(false);
                      setFreeQuoteTermsAccepted(false);
                    }}
                    className="schedule-btn-secondary-cusset"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmFreeQuote}
                    disabled={!freeQuoteTermsAccepted || isSubmitting || hasPendingFreeQuote}
                    className="schedule-btn-success-cusset"
                  >
                    {isSubmitting ? 'Submitting...' : 'Submit Quote Request'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
      </>
    );
  }

  // ============ PRE ASSESSMENT FORM PAGE ============
  if (currentStep === 'pre-assessment-form') {
    return (
      <>
        <Helmet><title>Book Pre Assessment | Salfer Engineering</title></Helmet>
        <div className="schedule-container-cusset">
          <div className="back-button-container-cusset">
            <button onClick={() => setCurrentStep('service-selection')} className="back-to-services-cusset">← Back to Services</button>
          </div>

          <div className="form-page-header-cusset">
            <h1 className="form-page-title-cusset">Book Pre Assessment</h1>
            <p className="form-page-subtitle-cusset">Complete the form below to schedule your professional pre-assessment (₱1,500)</p>
          </div>

          <div className="form-main-card-cusset">
            {/* Contact and Address Section */}
            <div className="form-section-cusset">
              <div className="form-section-header-cusset">
                <div className="form-section-icon-cusset">
                  <FaUserCircle />
                </div>
                <div className="form-section-title-group-cusset">
                  <h3>Contact and Address Information</h3>
                  <p>Your personal and location details</p>
                </div>
              </div>
              <div className="form-section-body-cusset">
                <div className="combined-info-card-cusset" onClick={() => setShowInfoModal(true)}>
                  <div className="combined-info-header-cusset">
                    <div className="combined-info-content-cusset">
                      <div className="combined-info-name-cusset">{getFullName() || 'Not provided'}</div>
                      <div className="combined-info-contact-cusset">{formData.contactNumber || 'Not provided'}</div>
                      <div className="combined-info-address-cusset">{getFullAddress() || 'No address selected'}</div>
                    </div>
                  </div>
                  <div className="combined-info-hint-cusset">Click to view full details and manage settings</div>
                </div>
                {validationErrors.address && (
                  <div className="error-message-cusset" style={{ marginTop: '10px' }}>{validationErrors.address}</div>
                )}
              </div>
            </div>

            {/* ============ APPLIANCES SECTION ============ */}
            <div className="form-section-cusset">
              <div className="form-section-header-cusset">
                <div className="form-section-icon-cusset">
                  <FaPlug />
                </div>
                <div className="form-section-title-group-cusset">
                  <h3>Your Appliances *</h3>
                  <p>List all your electrical devices with their usage hours (0-12 hours each)</p>
                </div>
              </div>
              <div className="form-section-body-cusset">
                <div className="appliances-section-cusset">
                  <div className="appliances-header-cusset">
                    <span className="appliances-count-cusset">{appliances.length} appliances added</span>
                    <button
                      type="button"
                      className="add-appliance-btn-cusset"
                      onClick={() => {
                        setEditingAppliance(null);
                        setApplianceForm({ name: '', powerWatts: '', quantity: '', dayHours: '', nightHours: '' });
                        setApplianceErrors({});
                        setShowApplianceModal(true);
                      }}
                    >
                      <FaPlus /> Add Appliance
                    </button>
                  </div>

                  {validationErrors.appliances && (
                    <div className="error-message-cusset">{validationErrors.appliances}</div>
                  )}

                  {appliances.length === 0 ? (
                    <div className="empty-appliances-cusset">
                      <FaLightbulb />
                      <p>No appliances added yet.</p>
                      <small>Click "Add Appliance" to list your electrical devices like air conditioning, refrigerator, lighting, etc.</small>
                    </div>
                  ) : (
                    <div className="appliances-table-container-cusset">
                      <table className="appliances-table-cusset">
                        <thead>
                          <tr>
                            <th>Appliance</th>
                            <th>Power (W)</th>
                            <th>Qty</th>
                            <th>Day Hours</th>
                            <th>Night Hours</th>
                            <th>Day Energy (kWh)</th>
                            <th>Night Energy (kWh)</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {appliances.map(appliance => {
                            const dayEnergy = (appliance.powerWatts * appliance.quantity * appliance.dayHours) / 1000;
                            const nightEnergy = (appliance.powerWatts * appliance.quantity * appliance.nightHours) / 1000;
                            return (
                              <tr key={appliance.id}>
                                <td><strong>{appliance.name}</strong></td>
                                <td>{appliance.powerWatts} W</td>
                                <td>{appliance.quantity}</td>
                                <td>{appliance.dayHours} hrs</td>
                                <td>{appliance.nightHours} hrs</td>
                                <td>{dayEnergy.toFixed(2)} kWh</td>
                                <td>{nightEnergy.toFixed(2)} kWh</td>
                                <td>
                                  <button className="edit-appliance-btn" onClick={() => editAppliance(appliance)}>
                                    <FaEye /> Edit
                                  </button>
                                  <button className="delete-appliance-btn" onClick={() => deleteAppliance(appliance.id)}>
                                    <FaTrash /> Delete
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Consumption Results */}
                {appliances.length > 0 && (
                  <div className="consumption-results-cusset">
                    <h4>Your Energy Profile</h4>
                    <div className="results-grid-cusset">
                      <div className="result-card-cusset day-result">
                        <FaSun className="result-icon" />
                        <div className="result-info">
                          <span className="result-label">Day Consumption</span>
                          <span className="result-value">{calculationResults.dayConsumption?.toFixed(2) || 0} kWh</span>
                          <span className="result-percentage">({calculationResults.dayPercentage?.toFixed(1) || 0}%)</span>
                        </div>
                      </div>
                      <div className="result-card-cusset night-result">
                        <FaMoon className="result-icon" />
                        <div className="result-info">
                          <span className="result-label">Night Consumption</span>
                          <span className="result-value">{calculationResults.nightConsumption?.toFixed(2) || 0} kWh</span>
                          <span className="result-percentage">({calculationResults.nightPercentage?.toFixed(1) || 0}%)</span>
                        </div>
                      </div>
                      <div className="result-card-cusset total-result">
                        <FaLightbulb className="result-icon" />
                        <div className="result-info">
                          <span className="result-label">Total Daily</span>
                          <span className="result-value">{calculationResults.totalDailyConsumption?.toFixed(2) || 0} kWh/day</span>
                          <small>Based on appliance usage only</small>
                        </div>
                      </div>
                      <div className="result-card-cusset monthly-result" style={{ background: '#e8f5e9', borderColor: '#4caf50' }}>
                        <FaFileInvoice className="result-icon" />
                        <div className="result-info">
                          <span className="result-label">Monthly Consumption</span>
                          <span className="result-value">{calculationResults.monthlyConsumption?.toFixed(2) || 0} kWh</span>
                          <small>Total Daily × 30 days</small>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {appliances.length === 0 && (
                  <div className="info-message-cusset">
                    <p>Please add at least one appliance to calculate your energy consumption.</p>
                  </div>
                )}
              </div>
            </div>

            {/* ============ ASSESSMENT DETAILS ============ */}
            <div className="form-section-cusset">
              <div className="form-section-header-cusset">
                <div className="form-section-icon-cusset">
                  <FaHome />
                </div>
                <div className="form-section-title-group-cusset">
                  <h3>Assessment Details</h3>
                  <p>Tell us about your property and system preferences</p>
                </div>
              </div>
              <div className="form-section-body-cusset">
                <div className="schedule-form-grid-cusset">
                  <div className="schedule-form-group-cusset">
                    <label>Monthly Electricity Bill (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="monthlyBill"
                      value={electricBillInput.monthlyBill}
                      onChange={handleElectricBillChange}
                      placeholder="e.g., 5000"
                      className="schedule-form-input-cusset"
                    />
                    <small>Your average monthly electricity bill amount (optional)</small>
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Property Type *</label>
                    <select 
                      name="propertyType" 
                      value={formData.propertyType} 
                      onChange={handleInputChange} 
                      className={`schedule-form-select-cusset ${validationErrors.propertyType ? 'error' : ''}`}
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                    </select>
                    {validationErrors.propertyType && (
                      <div className="error-message-cusset">{validationErrors.propertyType}</div>
                    )}
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Rate per kWh (₱)</label>
                    <input
                      type="number"
                      step="0.01"
                      name="ratePerKwh"
                      value={electricBillInput.ratePerKwh}
                      onChange={handleElectricBillChange}
                      placeholder="e.g., 11.50"
                      className="schedule-form-input-cusset"
                    />
                    <small>Check your electric bill for the rate (optional)</small>
                  </div>
                </div>

                <div className="schedule-form-grid-cusset" style={{ marginTop: '16px' }}>
                  <div className="schedule-form-group-cusset">
                    <label>Preferred System Type</label>
                    <select name="systemType" value={formData.systemType} onChange={handleInputChange} className="schedule-form-select-cusset">
                      <option value="">Select (optional)</option>
                      {SYSTEM_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
                    </select>
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Target Savings (%)</label>
                    <select
                      name="targetSavings"
                      value={formData.targetSavings}
                      onChange={handleInputChange}
                      className="schedule-form-select-cusset"
                    >
                      <option value="">Select target savings (optional)</option>
                      <option value="100">100% - Fully offset my bill</option>
                      <option value="75">75% - Significant reduction</option>
                      <option value="50">50% - Balanced approach</option>
                      <option value="25">25% - Basic savings</option>
                    </select>
                    <small>Help us size your system based on your savings goal</small>
                  </div>

                  <div className="schedule-form-group-cusset">
                    <label>Roof Type</label>
                    <select name="roofType" value={formData.roofType} onChange={handleInputChange} className="schedule-form-select-cusset">
                      <option value="">Select</option>
                      <option value="concrete">Concrete</option>
                      <option value="metal">Metal</option>
                      <option value="tile">Tile</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div className="schedule-form-group-cusset" style={{ gridColumn: '1 / -1' }}>
                    <label>Roof Dimensions</label>
                    <div className="dimension-row-cusset">
                      <input type="number" step="0.1" name="roofLength" value={formData.roofLength} onChange={handleInputChange} placeholder="Length (m)" className="schedule-form-input-cusset" />
                      <input type="number" step="0.1" name="roofWidth" value={formData.roofWidth} onChange={handleInputChange} placeholder="Width (m)" className="schedule-form-input-cusset" />
                    </div>
                  </div>
                </div>

                <div className="schedule-fee-card-cusset">
                  <div className="fee-card-icon-cusset">
                    <FaFileInvoice />
                  </div>
                  <div className="fee-card-content-cusset">
                    <strong>Pre Assessment Fee: ₱1,500.00</strong>
                    <p>Your booking will be confirmed by our admin. You will receive payment instructions after confirmation.</p>
                    <small>Includes: On-site visit, 7-day monitoring, detailed analysis, and system recommendation.</small>
                  </div>
                </div>

                <div className="form-actions-cusset">
                  <button
                    onClick={handleSubmitClick}
                    className="schedule-btn-submit-cusset"
                    disabled={appliances.length === 0}
                  >
                    Continue to Confirmation
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Appliance Modal */}
          {showApplianceModal && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowApplianceModal(false)}>
              <div className="schedule-modal-cusset appliance-modal-cusset" onClick={e => e.stopPropagation()}>
                <div className="modal-header-cusset">
                  <h3>{editingAppliance ? 'Edit Appliance' : 'Add Appliance'}</h3>
                  <button className="modal-close-cusset" onClick={() => setShowApplianceModal(false)}>×</button>
                </div>
                <div className="modal-body-cusset">
                  <div className="schedule-form-group-cusset">
                    <label>Appliance Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={applianceForm.name}
                      onChange={handleApplianceFormChange}
                      placeholder="e.g., Air Conditioner, Refrigerator, TV"
                      className={`schedule-form-input-cusset ${applianceErrors.name ? 'error' : ''}`}
                    />
                    {applianceErrors.name && (
                      <div className="error-message-cusset">{applianceErrors.name}</div>
                    )}
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Power Rating (Watts) *</label>
                    <input
                      type="number"
                      name="powerWatts"
                      value={applianceForm.powerWatts}
                      onChange={handleApplianceFormChange}
                      placeholder="e.g., 1500"
                      className={`schedule-form-input-cusset ${applianceErrors.powerWatts ? 'error' : ''}`}
                    />
                    {applianceErrors.powerWatts && (
                      <div className="error-message-cusset">{applianceErrors.powerWatts}</div>
                    )}
                    <small>Check the label on your appliance for watts (W)</small>
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      name="quantity"
                      value={applianceForm.quantity}
                      onChange={handleApplianceFormChange}
                      placeholder="e.g., 2"
                      className={`schedule-form-input-cusset ${applianceErrors.quantity ? 'error' : ''}`}
                    />
                    {applianceErrors.quantity && (
                      <div className="error-message-cusset">{applianceErrors.quantity}</div>
                    )}
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Day Usage Hours (0-12) *</label>
                    <input
                      type="number"
                      step="0.5"
                      name="dayHours"
                      value={applianceForm.dayHours}
                      onChange={handleApplianceFormChange}
                      placeholder="e.g., 8"
                      className={`schedule-form-input-cusset ${applianceErrors.dayHours ? 'error' : ''}`}
                      min="0"
                      max="12"
                    />
                    {applianceErrors.dayHours && (
                      <div className="error-message-cusset">{applianceErrors.dayHours}</div>
                    )}
                    <small>Hours used during daytime (0-12 hours, 6 AM - 6 PM)</small>
                  </div>
                  <div className="schedule-form-group-cusset">
                    <label>Night Usage Hours (0-12) *</label>
                    <input
                      type="number"
                      step="0.5"
                      name="nightHours"
                      value={applianceForm.nightHours}
                      onChange={handleApplianceFormChange}
                      placeholder="e.g., 4"
                      className={`schedule-form-input-cusset ${applianceErrors.nightHours ? 'error' : ''}`}
                      min="0"
                      max="12"
                    />
                    {applianceErrors.nightHours && (
                      <div className="error-message-cusset">{applianceErrors.nightHours}</div>
                    )}
                    <small>Hours used during nighttime (0-12 hours, 6 PM - 6 AM)</small>
                  </div>
                </div>
                <div className="modal-actions-cusset">
                  <button className="cancel-btn-cusset" onClick={() => setShowApplianceModal(false)}>Cancel</button>
                  <button className="save-btn-cusset" onClick={saveAppliance}>
                    <FaSave /> {editingAppliance ? 'Update' : 'Add'} Appliance
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Info Modal */}
          {showInfoModal && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowInfoModal(false)}>
              <div className="schedule-modal-cusset info-modal-cusset" onClick={e => e.stopPropagation()}>
                <div className="info-modal-header-cusset"><h3>Contact and Address Details</h3></div>
                <div className="info-modal-body-cusset">
                  <div className="info-section-cusset">
                    <h4>Personal Information</h4>
                    <div className="info-details-cusset">
                      <div className="info-row-cusset"><span>Full Name:</span><span>{getFullName() || 'Not provided'}</span></div>
                      <div className="info-row-cusset"><span>Contact:</span><span>{formData.contactNumber || 'Not provided'}</span></div>
                      {user?.email && <div className="info-row-cusset"><span>Email:</span><span>{user.email}</span></div>}
                    </div>
                    <button className="info-action-btn-cusset" onClick={handleProfileClick}>Edit Profile</button>
                  </div>
                  <div className="info-section-cusset">
                    <h4>Address Information</h4>
                    {addressDisplay ? (
                      <div className="info-details-cusset">
                        <div className="info-row-cusset"><span>House/Building:</span><span>{addressDisplay.houseOrBuilding}</span></div>
                        <div className="info-row-cusset"><span>Street:</span><span>{addressDisplay.street}</span></div>
                        <div className="info-row-cusset"><span>Barangay:</span><span>{addressDisplay.barangay}</span></div>
                        <div className="info-row-cusset"><span>City:</span><span>{addressDisplay.cityMunicipality}</span></div>
                        <div className="info-row-cusset"><span>Province:</span><span>{addressDisplay.province}</span></div>
                      </div>
                    ) : <p>No address selected</p>}
                    <button className="info-action-btn-cusset" onClick={handleAddressClick}>Change Address</button>
                  </div>
                </div>
                <div className="info-modal-footer-cusset"><button className="info-close-btn-cusset" onClick={() => setShowInfoModal(false)}>Close</button></div>
              </div>
            </div>
          )}

          {/* Pre Assessment Confirmation Dialog */}
          {showConfirmDialog && (
            <div className="schedule-modal-overlay-cusset" onClick={() => setShowConfirmDialog(false)}>
              <div className="schedule-modal-cusset" onClick={e => e.stopPropagation()}>
                <h2>Confirm Pre Assessment</h2>
                <div className="schedule-modal-summary-cusset">
                  <div className="schedule-summary-section-cusset">
                    <h4>Contact</h4>
                    <p><strong>Name:</strong> {getFullName()}</p>
                    <p><strong>Contact:</strong> {formData.contactNumber}</p>
                  </div>
                  <div className="schedule-summary-section-cusset">
                    <h4>Address</h4>
                    <p>{getFullAddress()}</p>
                  </div>
                  <div className="schedule-summary-section-cusset">
                    <h4>Energy Profile</h4>
                    <p><strong>Monthly Consumption:</strong> {calculationResults.monthlyConsumption?.toFixed(2)} kWh</p>
                    <p><strong>Total Daily:</strong> {calculationResults.totalDailyConsumption.toFixed(2)} kWh</p>
                    <p><strong>Day/Night:</strong> {calculationResults.dayPercentage.toFixed(0)}% / {calculationResults.nightPercentage.toFixed(0)}%</p>
                    <p><strong>Appliances:</strong> {appliances.length} items</p>
                  </div>
                  <div className="schedule-summary-section-cusset">
                    <h4>Assessment Details</h4>
                    <p><strong>Property:</strong> {formData.propertyType}</p>
                    <p><strong>Monthly Bill:</strong> {formatCurrency(electricBillInput.monthlyBill) || 'Not provided'}</p>
                    <p><strong>Fee:</strong> ₱1,500.00</p>
                    {formData.targetSavings && (
                      <p><strong>Target Savings:</strong> {formData.targetSavings}%</p>
                    )}
                    {formData.roofType && (
                      <p><strong>Roof Type:</strong> {formData.roofType}</p>
                    )}
                  </div>
                </div>
                <div className="schedule-modal-checkbox-cusset">
                  <label>
                    <input type="checkbox" checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />
                    <span>I agree to the <a href="/terms" target="_blank" className="terms-link">Terms and Conditions</a></span>
                  </label>
                </div>
                <div className="schedule-modal-actions-cusset">
                  <button onClick={() => setShowConfirmDialog(false)} className="schedule-btn-secondary-cusset">Cancel</button>
                  <button onClick={handleConfirmBooking} disabled={!termsAccepted || isSubmitting} className="schedule-btn-success-cusset">{isSubmitting ? 'Processing...' : 'Confirm Booking'}</button>
                </div>
              </div>
            </div>
          )}

          <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
        </div>
      </>
    );
  }

  return null;
};

export default ScheduleAssessment;