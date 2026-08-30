// pages/Customer/Quotation.cuspro.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Customer/quotation.css';

// =========================================
// CARD INPUT FORMATTING HELPERS
// =========================================

// Format card number with spaces every 4 digits, max 16 digits
const formatCardNumber = (value) => {
  const cleaned = value.replace(/\D/g, '');
  const limited = cleaned.slice(0, 16);
  const formatted = limited.replace(/(.{4})/g, '$1 ').trim();
  return formatted;
};

// Format expiry date: auto-add "/" after 2 digits, restrict to MM/YY
const formatExpiryDate = (value) => {
  const cleaned = value.replace(/\D/g, '');
  const limited = cleaned.slice(0, 4);
  if (limited.length === 0) return '';
  if (limited.length <= 2) return limited;
  return `${limited.slice(0, 2)}/${limited.slice(2)}`;
};

// Format CVC - max 3 digits
const formatCVC = (value) => {
  return value.replace(/\D/g, '').slice(0, 3);
};

const Quotation = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuccessPage, setShowSuccessPage] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);
  const [showFullPaymentModal, setShowFullPaymentModal] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [processingMessage, setProcessingMessage] = useState('');
  const [pdfLoading, setPdfLoading] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

  const [validationErrors, setValidationErrors] = useState({});
  const scrollContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);

  const [selectedBankId, setSelectedBankId] = useState('');
  const [manualTransferForm, setManualTransferForm] = useState({
    accountName: '',
    transactionReference: '',
    amount: '',
    transferDate: '',
    transferTime: '',
    remarks: ''
  });
  const [proofFile, setProofFile] = useState(null);
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [showManualTransferForm, setShowManualTransferForm] = useState(false);

  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [freeQuotes, setFreeQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);
  const [solarInvoices, setSolarInvoices] = useState([]);
  const [allItems, setAllItems] = useState([]);
  const [activeTab, setActiveTab] = useState('all');

  const companyBanks = [
    { id: 'bpo', name: 'BPO', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'bpi', name: 'BPI', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'metrobank', name: 'Metrobank', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'security_bank', name: 'Security Bank', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' }
  ];

  const saveScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      scrollPositionRef.current = scrollContainerRef.current.scrollTop;
    }
  }, []);

  const restoreScrollPosition = useCallback(() => {
    if (scrollContainerRef.current) {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = scrollPositionRef.current;
        }
      });
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const handleScroll = () => {
        scrollPositionRef.current = container.scrollTop;
      };
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
  }, []);

  useEffect(() => {
    fetchUserData();
    fetchData();
  }, []);

  const fetchUserData = async () => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (!token) return;
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(response.data.client);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  const getFullName = () => {
    if (!user) return '';
    return [user.contactFirstName, user.contactMiddleName, user.contactLastName].filter(n => n).join(' ');
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');

      const freeQuotesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/free-quotes/my-quotes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFreeQuotes(freeQuotesRes.data.quotes || []);

      const projectsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/projects/my-projects`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProjects(projectsRes.data.projects || []);

      const preAssessmentsRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/pre-assessments/my-bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const invoicesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/solar-invoices/my-invoices`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const invoices = invoicesRes.data.invoices || [];
      setSolarInvoices(invoices);

      const transformedPreAssessments = preAssessmentsRes.data.assessments
        ?.filter(assessment =>
          assessment.invoiceNumber &&
          assessment.assessmentStatus !== 'pending_review'
        )
        .map(assessment => ({
          id: assessment.invoiceNumber,
          date: new Date(assessment.bookedAt).toLocaleDateString(),
          dueDate: new Date(assessment.preferredDate).toLocaleDateString(),
          amount: assessment.assessmentFee,
          status: assessment.paymentStatus === 'paid' ? 'paid' :
            assessment.paymentStatus === 'for_verification' ? 'for_verification' :
              assessment.paymentStatus === 'pending' ? 'pending' : 'pending',
          description: 'Pre-Assessment Fee',
          type: 'pre-assessment',
          typeLabel: 'Pre-Assessment',
          bookingReference: assessment.bookingReference,
          paymentStatus: assessment.paymentStatus,
          propertyType: assessment.propertyType,
          desiredCapacity: assessment.desiredCapacity,
          roofType: assessment.roofType,
          preferredDate: assessment.preferredDate,
          address: assessment.address,
          bookedAt: assessment.bookedAt,
          invoiceNumber: assessment.invoiceNumber,
          assessmentId: assessment._id,
          assessmentStatus: assessment.assessmentStatus,
          quotation: assessment.quotation,
          quotationUrl: assessment.quotation?.quotationUrl || assessment.finalQuotation,
          systemSize: assessment.quotation?.systemDetails?.systemSize,
          systemType: assessment.quotation?.systemDetails?.systemType,
          totalCost: assessment.quotation?.systemDetails?.totalCost,
          panelsNeeded: assessment.quotation?.systemDetails?.panelsNeeded,
          inverterType: assessment.quotation?.systemDetails?.inverterType,
          batteryType: assessment.quotation?.systemDetails?.batteryType,
          receiptUrl: assessment.receiptUrl,
          receiptNumber: assessment.receiptNumber
        })) || [];

      const transformedProjectBills = invoices.map(invoice => ({
        id: invoice.invoiceNumber,
        date: new Date(invoice.issueDate).toLocaleDateString(),
        dueDate: new Date(invoice.dueDate).toLocaleDateString(),
        amount: invoice.totalAmount,
        status: invoice.paymentStatus === 'paid' ? 'paid' :
          invoice.paymentStatus === 'partial' ? 'partial' :
            invoice.paymentStatus === 'overdue' ? 'overdue' :
              invoice.paymentStatus === 'for_verification' ? 'for_verification' : 'pending',
        description: invoice.description,
        type: 'project',
        typeLabel: 'Project Bill',
        projectId: invoice.projectId?._id,
        projectName: invoice.projectId?.projectName,
        projectReference: invoice.projectId?.projectReference,
        invoiceType: invoice.invoiceType,
        invoiceId: invoice._id,
        invoiceNumber: invoice.invoiceNumber,
        paymentStatus: invoice.paymentStatus,
        totalAmount: invoice.totalAmount,
        amountPaid: invoice.amountPaid,
        balance: invoice.balance,
        payments: invoice.payments,
        receiptUrl: invoice.receiptUrl,
        receiptNumber: invoice.receiptNumber
      }));

      setPreAssessments(transformedPreAssessments);
      const combinedItems = [...transformedPreAssessments, ...transformedProjectBills];
      setAllItems(combinedItems);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching data:', err);
      showToast('Failed to load data', 'error');
      setLoading(false);
    }
  };

  const getProjectPaymentPlan = (projectId) => {
    const project = projects.find(p => p._id?.toString() === projectId?.toString());
    return project?.paymentPreference || 'installment';
  };

  const isInitialPaymentCompleted = (projectId) => {
    const projectInvoices = allItems.filter(item =>
      item.type === 'project' &&
      item.projectId === projectId
    );
    const initialInvoice = projectInvoices.find(inv => inv.invoiceType === 'initial');
    return initialInvoice && initialInvoice.status === 'paid';
  };

  const isProgressPaymentCompleted = (projectId) => {
    const projectInvoices = allItems.filter(item =>
      item.type === 'project' &&
      item.projectId === projectId
    );
    const progressInvoice = projectInvoices.find(inv => inv.invoiceType === 'progress');
    return progressInvoice && progressInvoice.status === 'paid';
  };

  const isFinalPaymentCompleted = (projectId) => {
    const projectInvoices = allItems.filter(item =>
      item.type === 'project' &&
      item.projectId === projectId
    );
    const finalInvoice = projectInvoices.find(inv => inv.invoiceType === 'final');
    return finalInvoice && finalInvoice.status === 'paid';
  };

  const isPayNowDisabled = (item) => {
    if (item.type !== 'project') return false;

    const invoiceType = item.invoiceType;
    const projectId = item.projectId;
    const paymentPlan = getProjectPaymentPlan(projectId);

    if (paymentPlan === 'full') {
      return false;
    }

    if (paymentPlan === 'fifty_fifty') {
      if (invoiceType === 'final') {
        return !isInitialPaymentCompleted(projectId);
      }
      return false;
    }

    if (paymentPlan === 'thirty_sixty_ten') {
      if (invoiceType === 'progress') {
        return !isInitialPaymentCompleted(projectId);
      }
      if (invoiceType === 'final') {
        return !isProgressPaymentCompleted(projectId);
      }
      return false;
    }

    if (invoiceType === 'progress') {
      return !isInitialPaymentCompleted(projectId);
    }
    if (invoiceType === 'final') {
      return !isProgressPaymentCompleted(projectId);
    }
    if (invoiceType === 'retention') {
      return !isFinalPaymentCompleted(projectId);
    }

    return false;
  };

  const getPayNowDisabledReason = (item) => {
    if (item.type !== 'project') return null;

    const invoiceType = item.invoiceType;
    const projectId = item.projectId;
    const paymentPlan = getProjectPaymentPlan(projectId);

    if (paymentPlan === 'fifty_fifty') {
      if (invoiceType === 'final') {
        return 'Downpayment (50%) must be completed first';
      }
    }

    if (paymentPlan === 'thirty_sixty_ten') {
      if (invoiceType === 'progress') {
        return 'Initial payment (30%) must be completed first';
      }
      if (invoiceType === 'final') {
        return 'Progress payment (60%) must be completed first';
      }
    }

    if (invoiceType === 'progress') {
      return 'Initial payment (30%) must be completed first';
    }
    if (invoiceType === 'final') {
      return 'Progress payment (40%) must be completed first';
    }
    if (invoiceType === 'retention') {
      return 'Final payment (30%) must be completed first. Retention fee is released after project completion and warranty period.';
    }

    return null;
  };

  const getInvoiceTypeLabel = (item) => {
    if (!item.invoiceType) return '';

    const invoiceType = item.invoiceType;
    const projectId = item.projectId;
    const paymentPlan = getProjectPaymentPlan(projectId);

    if (paymentPlan === 'full') {
      if (invoiceType === 'full') return 'Full Payment (100%)';
    }

    if (paymentPlan === 'fifty_fifty') {
      if (invoiceType === 'initial') return 'Downpayment (50%)';
      if (invoiceType === 'final') return 'Final Payment (50%)';
    }

    if (paymentPlan === 'thirty_sixty_ten') {
      if (invoiceType === 'initial') return 'Downpayment (30%)';
      if (invoiceType === 'progress') return 'Progress Payment (60%)';
      if (invoiceType === 'final') return 'Retention Fee (10%)';
    }

    if (invoiceType === 'initial') return 'Initial (30%)';
    if (invoiceType === 'progress') return 'Progress (40%)';
    if (invoiceType === 'final') return 'Final (30%)';
    if (invoiceType === 'retention') return 'Retention Fee (10%)';

    return invoiceType;
  };

  const handleViewReceipt = async (item) => {
    try {
      let receiptUrl = null;

      if (item.type === 'pre-assessment') {
        receiptUrl = item.receiptUrl;
      } else if (item.type === 'project') {
        receiptUrl = item.receiptUrl;
      }

      if (!receiptUrl) {
        showToast('No receipt available for this transaction', 'warning');
        return;
      }

      window.open(receiptUrl, '_blank');
    } catch (error) {
      console.error('Error viewing receipt:', error);
      showToast('Failed to load receipt', 'error');
    }
  };

  const handleDownloadReceipt = async (item) => {
    try {
      let receiptUrl = null;
      let receiptNumber = null;

      if (item.type === 'pre-assessment') {
        receiptUrl = item.receiptUrl;
        receiptNumber = item.receiptNumber;
      } else if (item.type === 'project') {
        receiptUrl = item.receiptUrl;
        receiptNumber = item.receiptNumber;
      }

      if (!receiptUrl) {
        showToast('No receipt available for this transaction', 'warning');
        return;
      }

      const response = await axios.get(receiptUrl, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Receipt-${receiptNumber || 'download'}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast('Receipt downloaded successfully!', 'success');
    } catch (error) {
      console.error('Error downloading receipt:', error);
      showToast('Failed to download receipt', 'error');
    }
  };

  const formatAddress = (address) => {
    if (!address) return 'No address provided';
    if (typeof address === 'string') return address;
    const parts = [];
    if (address.houseOrBuilding) parts.push(address.houseOrBuilding);
    if (address.street) parts.push(address.street);
    if (address.barangay) parts.push(address.barangay);
    if (address.cityMunicipality) parts.push(address.cityMunicipality);
    if (address.province) parts.push(address.province);
    if (address.zipCode) parts.push(address.zipCode);
    return parts.length > 0 ? parts.join(', ') : 'No address provided';
  };

  const validateGCashReference = (reference) => {
    if (!reference) return 'GCash reference number is required';
    const cleanRef = reference.replace(/\s/g, '');
    if (!/^\d{13}$/.test(cleanRef)) {
      return 'GCash reference must be exactly 13 digits (0-9)';
    }
    return '';
  };

  const validateCardNumber = (number) => {
    const cleanNum = number?.replace(/\s/g, '') || '';
    if (!cleanNum) return 'Card number is required';
    if (!/^\d{16}$/.test(cleanNum)) {
      return 'Card number must be exactly 16 digits (0-9)';
    }
    return '';
  };

  const validateCardExpiry = (expiry) => {
    if (!expiry) return 'Expiry date is required';
    const cleanExpiry = expiry.replace(/\s/g, '');
    if (!/^\d{2}\/\d{2}$/.test(cleanExpiry)) {
      return 'Expiry must be in MM/YY format';
    }
    const [month, year] = cleanExpiry.split('/');
    const monthNum = parseInt(month);
    const yearNum = parseInt(year);
    if (monthNum < 1 || monthNum > 12) {
      return 'Invalid month (must be 01-12)';
    }
    const currentYear = new Date().getFullYear() % 100;
    const currentMonth = new Date().getMonth() + 1;
    if (yearNum < currentYear || (yearNum === currentYear && monthNum < currentMonth)) {
      return 'Card has expired';
    }
    if (yearNum > currentYear + 10) {
      return 'Expiry year is too far in the future';
    }
    return '';
  };

  const validateCVC = (cvc) => {
    if (!cvc) return 'CVC is required';
    if (!/^\d{3}$/.test(cvc)) {
      return 'CVC must be exactly 3 digits (0-9)';
    }
    return '';
  };

  const validateBankAccountName = (name) => {
    if (!name) return '';
    if (!/^[a-zA-Z\s.]+$/.test(name)) {
      return 'Account name must contain only letters and spaces';
    }
    if (name.trim().length < 2) {
      return 'Account name must be at least 2 characters';
    }
    return '';
  };

  const validateAmountSent = (amount, dueAmount) => {
    if (!amount) return 'Amount sent is required';
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return 'Please enter a valid amount';
    }
    if (numAmount !== dueAmount) {
      return `Amount must exactly match the due amount (${formatCurrency(dueAmount)})`;
    }
    return '';
  };

  const validateTransferDate = (date, invoiceDate) => {
    if (!date) return 'Transfer date is required';

    const selectedDate = new Date(date);
    selectedDate.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let creationDate;
    if (invoiceDate) {
      creationDate = new Date(invoiceDate);
      creationDate.setHours(0, 0, 0, 0);
    } else {
      creationDate = new Date();
      creationDate.setDate(creationDate.getDate() - 30);
      creationDate.setHours(0, 0, 0, 0);
    }

    if (selectedDate < creationDate) {
      return `Transfer date cannot be before the invoice date (${creationDate.toLocaleDateString()})`;
    }

    if (selectedDate > today) {
      return 'Transfer date cannot be in the future';
    }

    return '';
  };

  const validateTransferTime = (time) => {
    if (!time) return 'Transfer time is required';
    return '';
  };

  const validateProofFile = (file) => {
    if (!file) return 'Please upload proof of payment';
    return '';
  };

  const validateTransactionReference = (reference) => {
    if (!reference) return 'Transaction reference number is required';
    return '';
  };

  const handleManualTransferInputChange = (e) => {
    const { name, value } = e.target;
    setManualTransferForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleProofFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        showToast('File too large. Maximum size is 10MB.', 'error');
        e.target.value = '';
        return;
      }
      setProofFile(file);
    }
  };

  const handleSubmitManualTransfer = async () => {
    setValidationErrors({});

    const dueAmount = parseFloat(selectedItem?.balance || selectedItem?.totalAmount || selectedItem?.amount);
    const errors = {};

    if (!selectedBankId) {
      errors.bank = 'Please select a bank';
    }

    const refError = validateTransactionReference(manualTransferForm.transactionReference);
    if (refError) errors.transactionReference = refError;

    const amountError = validateAmountSent(manualTransferForm.amount, dueAmount);
    if (amountError) errors.amount = amountError;

    const invoiceDate = selectedItem?.date || selectedItem?.bookedAt || selectedItem?.issueDate;
    const dateError = validateTransferDate(manualTransferForm.transferDate, invoiceDate);
    if (dateError) errors.transferDate = dateError;
    const timeError = validateTransferTime(manualTransferForm.transferTime);
    if (timeError) errors.transferTime = timeError;

    const proofError = validateProofFile(proofFile);
    if (proofError) errors.proofFile = proofError;

    const accountNameError = validateBankAccountName(manualTransferForm.accountName);
    if (accountNameError) errors.accountName = accountNameError;

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      const firstError = Object.values(errors)[0];
      showToast(firstError, 'warning');
      return;
    }

    setIsSubmittingManual(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const selectedBank = companyBanks.find(b => b.id === selectedBankId);
      const invoiceId = selectedItem.invoiceId || selectedItem.id;

      const formDataToSend = new FormData();
      formDataToSend.append('invoiceId', invoiceId);
      formDataToSend.append('bankName', selectedBank.name);
      formDataToSend.append('accountName', manualTransferForm.accountName || '');
      formDataToSend.append('transactionReference', manualTransferForm.transactionReference);
      formDataToSend.append('amount', manualTransferForm.amount);
      formDataToSend.append('transferDate', manualTransferForm.transferDate);
      formDataToSend.append('transferTime', manualTransferForm.transferTime);
      formDataToSend.append('remarks', manualTransferForm.remarks || '');
      formDataToSend.append('proofOfPayment', proofFile);

      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/bank-transfer/manual`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      if (response.data.success) {
        setSuccessMessage('Payment Submitted!');
        setSuccessDetails({
          title: 'Bank Transfer Submitted for Verification',
          message: 'Your payment has been submitted and is now pending verification by our finance team.',
          reference: selectedItem.invoiceNumber || selectedItem.id
        });
        setShowSuccessPage(true);

        setSelectedBankId('');
        setManualTransferForm({
          accountName: '',
          transactionReference: '',
          amount: '',
          transferDate: '',
          transferTime: '',
          remarks: ''
        });
        setProofFile(null);
        setShowManualTransferForm(false);
        setPaymentMethod(null);

        closeFullPaymentModal();
        fetchData();
        showToast('Bank transfer submitted successfully! Waiting for verification.', 'success');
      }
    } catch (error) {
      console.error('Manual bank transfer error:', error);
      showToast(error.response?.data?.message || 'Failed to submit bank transfer', 'error');
    } finally {
      setIsSubmittingManual(false);
    }
  };

  const handleBankSelect = (bankId) => {
    setSelectedBankId(bankId);
  };

  const handlePayMongoCardPayment = async () => {
    setShowProcessingModal(true);
    setProcessingMessage('Processing your card payment...');

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '');
      const cardExpiry = document.getElementById('card-expiry')?.value;
      const cardCvc = document.getElementById('card-cvc')?.value;

      const errors = {};
      const cardNumError = validateCardNumber(cardNumber);
      if (cardNumError) errors.cardNumber = cardNumError;
      const expiryError = validateCardExpiry(cardExpiry);
      if (expiryError) errors.cardExpiry = expiryError;
      const cvcError = validateCVC(cardCvc);
      if (cvcError) errors.cardCvc = cvcError;

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        const firstError = Object.values(errors)[0];
        showToast(firstError, 'warning');
        setShowProcessingModal(false);
        return;
      }

      const [expMonth, expYear] = cardExpiry.split('/');

      const intentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/pre-assessment/${selectedItem.assessmentId}/create-intent`,
        { paymentMethod: 'card' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!intentResponse.data.success) throw new Error('Failed to create payment intent');

      const paymentIntentId = intentResponse.data.paymentIntentId;
      sessionStorage.setItem('pendingPaymentIntentId', paymentIntentId);

      const paymentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/process-card-payment`,
        {
          paymentIntentId: paymentIntentId,
          cardDetails: { cardNumber, expMonth: parseInt(expMonth), expYear: parseInt(expYear), cvc: cardCvc }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (paymentResponse.data.success) {
        setSuccessMessage('Payment Successful!');
        setSuccessDetails({
          title: 'Payment Completed',
          message: 'Your payment has been successfully processed.',
          reference: selectedItem.bookingReference
        });
        setShowProcessingModal(false);
        setShowSuccessPage(true);
        closeModal();
        fetchData();
      } else {
        setShowProcessingModal(false);
        showToast(paymentResponse.data.message || 'Payment failed', 'error');
      }
    } catch (err) {
      setShowProcessingModal(false);
      console.error('Card payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process card payment', 'error');
    }
  };

  const handleProjectInvoicePayment = async (invoice) => {
    if (isPayNowDisabled(invoice)) {
      const reason = getPayNowDisabledReason(invoice);
      showToast(reason, 'warning');
      return;
    }

    setSelectedItem({
      ...invoice,
      _id: invoice.projectId,
      projectId: invoice.projectId,
      projectName: invoice.projectName,
      totalCost: invoice.totalAmount,
      invoiceId: invoice.invoiceId
    });
    setShowFullPaymentModal(true);
  };

  const handleProjectPayMongoCardPayment = async () => {
    setShowProcessingModal(true);
    setProcessingMessage('Processing your card payment...');

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const cardNumber = document.getElementById('full-card-number')?.value.replace(/\s/g, '');
      const cardExpiry = document.getElementById('full-card-expiry')?.value;
      const cardCvc = document.getElementById('full-card-cvc')?.value;

      const errors = {};
      const cardNumError = validateCardNumber(cardNumber);
      if (cardNumError) errors.cardNumber = cardNumError;
      const expiryError = validateCardExpiry(cardExpiry);
      if (expiryError) errors.cardExpiry = expiryError;
      const cvcError = validateCVC(cardCvc);
      if (cvcError) errors.cardCvc = cvcError;

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        const firstError = Object.values(errors)[0];
        showToast(firstError, 'warning');
        setShowProcessingModal(false);
        return;
      }

      const [expMonth, expYear] = cardExpiry.split('/');

      const intentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/invoice/${selectedItem.invoiceId}/create-intent`,
        { paymentMethod: 'card' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!intentResponse.data.success) throw new Error('Failed to create payment intent');

      const paymentIntentId = intentResponse.data.paymentIntentId;

      const paymentResponse = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/process-card-payment`,
        {
          paymentIntentId: paymentIntentId,
          cardDetails: { cardNumber, expMonth: parseInt(expMonth), expYear: parseInt(expYear), cvc: cardCvc }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (paymentResponse.data.success) {
        setSuccessMessage('Payment Successful!');
        setSuccessDetails({
          title: 'Payment Completed',
          message: 'Your payment has been successfully processed.',
          reference: selectedItem.invoiceNumber
        });
        setShowProcessingModal(false);
        setShowSuccessPage(true);
        closeFullPaymentModal();
        fetchData();
      } else {
        setShowProcessingModal(false);
        showToast(paymentResponse.data.message || 'Payment failed', 'error');
      }
    } catch (err) {
      setShowProcessingModal(false);
      console.error('Project card payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process card payment', 'error');
    }
  };

  const handlePayNowClick = (item) => {
    if (item.type === 'project' && isPayNowDisabled(item)) {
      const reason = getPayNowDisabledReason(item);
      showToast(reason, 'warning');
      return;
    }

    if (item.type === 'project') {
      handleProjectInvoicePayment(item);
    } else {
      setSelectedItem(item);
      setPaymentMethod(null);
      setPaymentProof(null);
      setPaymentReference('');
      setShowPaymentModal(true);
    }
    setActiveDropdown(null);
  };

  const handleViewDetails = (item) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
    setActiveDropdown(null);
  };

  const handlePaymentReferenceChange = (e) => {
    saveScrollPosition();
    setPaymentReference(e.target.value);
    setTimeout(restoreScrollPosition, 0);
  };

  const handlePaymentProofChange = (e) => {
    saveScrollPosition();
    setPaymentProof(e.target.files[0]);
    setTimeout(restoreScrollPosition, 0);
  };

  const handleCardNumberInput = (e) => {
    const input = e.target;
    const oldValue = input.value;
    const newValue = formatCardNumber(oldValue);

    if (newValue !== oldValue) {
      const cursorPos = input.selectionStart;
      input.value = newValue;
      const diff = newValue.length - oldValue.length;
      const newCursorPos = cursorPos + diff;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }
  };

  const handleExpiryInput = (e) => {
    const input = e.target;
    const oldValue = input.value;
    const newValue = formatExpiryDate(oldValue);

    if (newValue !== oldValue) {
      const cursorPos = input.selectionStart;
      input.value = newValue;
      const diff = newValue.length - oldValue.length;
      const newCursorPos = cursorPos + diff;
      input.setSelectionRange(newCursorPos, newCursorPos);
    }
  };

  const handleCVCInput = (e) => {
    const input = e.target;
    const oldValue = input.value;
    const newValue = formatCVC(oldValue);

    if (newValue !== oldValue) {
      input.value = newValue;
    }
  };

  const handlePaymentSubmit = async () => {
    if (isSubmitting) return;

    if (!paymentMethod) {
      showToast('Please select a payment method', 'warning');
      return;
    }

    if (paymentMethod === 'gcash') {
      if (!paymentProof) {
        showToast('Please upload payment proof', 'warning');
        return;
      }
      if (!paymentReference) {
        showToast('Please enter GCash reference number', 'warning');
        return;
      }
      const refError = validateGCashReference(paymentReference);
      if (refError) {
        showToast(refError, 'warning');
        return;
      }
    }

    setShowProcessingModal(true);
    setProcessingMessage('Processing your payment...');
    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      if (paymentMethod === 'gcash') {
        const formData = new FormData();
        formData.append('invoiceNumber', selectedItem.invoiceNumber || selectedItem.id);
        formData.append('paymentMethod', 'gcash');
        formData.append('paymentReference', paymentReference);
        formData.append('paymentProof', paymentProof);
        await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/submit-payment`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setShowProcessingModal(false);
        setSuccessMessage('Payment Submitted!');
        setSuccessDetails({
          title: 'Payment Submitted for Verification',
          message: 'Your payment has been submitted and is now pending verification.',
          reference: selectedItem.bookingReference
        });
        setShowSuccessPage(true);
        closeModal();
        await fetchData();
      } else if (paymentMethod === 'cash') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/cash-payment`, {
          bookingReference: selectedItem.bookingReference
        }, { headers: { Authorization: `Bearer ${token}` } });
        setShowProcessingModal(false);
        setSuccessMessage('Cash Payment Selected!');
        setSuccessDetails({
          title: 'Cash Payment Option',
          message: 'Please visit our office to complete your payment.',
          reference: selectedItem.bookingReference
        });
        setShowSuccessPage(true);
        closeModal();
        await fetchData();
      }
    } catch (err) {
      setShowProcessingModal(false);
      console.error('Payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashPaymentSubmit = async () => {
    setShowProcessingModal(true);
    setProcessingMessage('Processing your payment...');
    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/cash-payment`, {
        bookingReference: selectedItem.bookingReference
      }, { headers: { Authorization: `Bearer ${token}` } });
      setShowProcessingModal(false);
      setSuccessMessage('Cash Payment Selected!');
      setSuccessDetails({
        title: 'Cash Payment Option',
        message: 'Please visit our office to complete your payment.',
        reference: selectedItem.bookingReference
      });
      setShowSuccessPage(true);
      closeModal();
      fetchData();
    } catch (err) {
      setShowProcessingModal(false);
      console.error('Cash payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process cash payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFullPaymentSubmit = async () => {
    if (!paymentMethod) {
      showToast('Please select a payment method', 'warning');
      return;
    }

    if (paymentMethod === 'gcash') {
      if (!paymentProof) {
        showToast('Please upload payment proof', 'warning');
        return;
      }
      if (!paymentReference) {
        showToast('Please enter GCash reference number', 'warning');
        return;
      }
      const refError = validateGCashReference(paymentReference);
      if (refError) {
        showToast(refError, 'warning');
        return;
      }
    }

    setShowProcessingModal(true);
    setProcessingMessage('Processing your payment...');
    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const fullAmount = parseFloat(selectedItem.totalAmount);
      if (paymentMethod === 'gcash') {
        const formData = new FormData();
        formData.append('amount', fullAmount.toString());
        formData.append('paymentMethod', 'gcash');
        formData.append('paymentReference', paymentReference);
        formData.append('paymentType', 'full');
        formData.append('invoiceId', selectedItem.invoiceId);
        if (paymentProof) formData.append('paymentProof', paymentProof);
        await axios.post(`${import.meta.env.VITE_API_URL}/api/solar-invoices/${selectedItem.invoiceId}/pay`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        });
        setShowProcessingModal(false);
        setSuccessMessage('Payment Submitted!');
        setSuccessDetails({
          title: 'Payment Submitted for Verification',
          message: 'Your payment has been submitted and is now pending verification.',
          reference: selectedItem.invoiceNumber
        });
        setShowSuccessPage(true);
        closeFullPaymentModal();
        fetchData();
      } else if (paymentMethod === 'cash') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/solar-invoices/${selectedItem.invoiceId}/pay-cash`, {
          amount: fullAmount
        }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        setShowProcessingModal(false);
        setSuccessMessage('Cash Payment Selected!');
        setSuccessDetails({
          title: 'Cash Payment Option',
          message: 'Please visit our office to complete your payment.',
          reference: selectedItem.invoiceNumber
        });
        setShowSuccessPage(true);
        closeFullPaymentModal();
        fetchData();
      }
    } catch (err) {
      setShowProcessingModal(false);
      console.error('Payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeModal = () => {
    setShowPaymentModal(false);
    setSelectedItem(null);
    setPaymentProof(null);
    setPaymentReference('');
    setPaymentMethod(null);
    setShowManualTransferForm(false);
    setValidationErrors({});
  };

  const closeFullPaymentModal = () => {
    setShowFullPaymentModal(false);
    setSelectedItem(null);
    setPaymentProof(null);
    setPaymentReference('');
    setPaymentMethod(null);
    setShowManualTransferForm(false);
    setSelectedBankId('');
    setProofFile(null);
    setManualTransferForm({
      accountName: '',
      transactionReference: '',
      amount: '',
      transferDate: '',
      transferTime: '',
      remarks: ''
    });
    setValidationErrors({});
  };

  const closeSuccessPage = () => {
    setShowSuccessPage(false);
    setSuccessMessage('');
    setSuccessDetails(null);
    navigate('/app/customer/billing');
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': <span className="billing-customer-status-badge pending">Pending</span>,
      'pending_payment': <span className="billing-customer-status-badge pending">Pending</span>,
      'paid': <span className="billing-customer-status-badge paid">Paid</span>,
      'for_verification': <span className="billing-customer-status-badge for-verification">Verifying</span>,
      'processing': <span className="billing-customer-status-badge processing">Processing</span>,
      'quoted': <span className="billing-customer-status-badge quoted">Quoted</span>,
      'completed': <span className="billing-customer-status-badge completed">Completed</span>,
      'cancelled': <span className="billing-customer-status-badge cancelled">Cancelled</span>,
      'overdue': <span className="billing-customer-status-badge overdue">Overdue</span>,
      'partial': <span className="billing-customer-status-badge partial">Partial</span>
    };
    return badges[status] || <span className="billing-customer-status-badge">{status}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount || 0);
  };

  const getFilteredItems = () => {
    let filtered = [...allItems];

    if (typeFilter !== 'all') {
      filtered = filtered.filter(item => item.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.id?.toLowerCase().includes(term) ||
        item.bookingReference?.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.projectName?.toLowerCase().includes(term) ||
        item.invoiceNumber?.toLowerCase().includes(term)
      );
    }

    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));

    return filtered;
  };

  const getStatistics = () => {
    const totalItems = allItems.length;
    const pendingItems = allItems.filter(i => i.status === 'pending' || i.status === 'pending_payment').length;
    const paidItems = allItems.filter(i => i.status === 'paid').length;
    const forVerificationItems = allItems.filter(i => i.status === 'for_verification').length;
    const totalAmount = allItems.reduce((sum, i) => sum + (i.amount || 0), 0);
    const pendingAmount = allItems.filter(i => i.status === 'pending' || i.status === 'pending_payment').reduce((sum, i) => sum + (i.amount || 0), 0);

    return { totalItems, pendingItems, paidItems, forVerificationItems, totalAmount, pendingAmount };
  };

  const ManualBankTransferSection = () => {
    const selectedBank = companyBanks.find(b => b.id === selectedBankId);
    const dueAmount = parseFloat(selectedItem?.balance || selectedItem?.totalAmount || selectedItem?.amount);

    const handleBankSelect = (bankId) => {
      saveScrollPosition();
      setSelectedBankId(bankId);
      if (validationErrors.bank) {
        setValidationErrors(prev => ({ ...prev, bank: '' }));
      }
      setTimeout(restoreScrollPosition, 0);
    };

    return (
      <div className="billing-customer-manual-bank-transfer-section">
        <div className="billing-customer-bank-transfer-info">
          <h4>Manual Bank Transfer</h4>
          <p>Transfer the exact amount to any of our bank accounts below.</p>

          <div className="billing-customer-bank-transfer-notice">
            <small>
              <strong>Important:</strong>
              <ul>
                <li>Transfer the <strong>exact amount</strong> shown on your invoice</li>
                <li>Include your <strong>Invoice Number</strong> as the reference</li>
                <li>Upload a clear screenshot or photo of your transaction</li>
                <li>Your payment will be verified within 24-48 hours</li>
              </ul>
            </small>
          </div>

          <div className="billing-customer-invoice-summary-box">
            <div className="billing-customer-summary-row">
              <span>Invoice:</span>
              <strong>{selectedItem?.invoiceNumber || selectedItem?.id}</strong>
            </div>
            <div className="billing-customer-summary-row">
              <span>Amount Due:</span>
              <strong className="billing-customer-amount-due">
                {formatCurrency(dueAmount)}
              </strong>
            </div>
            <div className="billing-customer-summary-row">
              <span>Reference Number:</span>
              <strong>{selectedItem?.invoiceNumber || selectedItem?.id}</strong>
            </div>
          </div>

          <div className="billing-customer-bank-selection-group">
            <label>Select Bank Account</label>
            <div className="billing-customer-bank-grid">
              {companyBanks.map((bank) => (
                <div
                  key={bank.id}
                  className={`billing-customer-bank-card ${selectedBankId === bank.id ? 'selected' : ''}`}
                  onClick={() => handleBankSelect(bank.id)}
                >
                  <div className="billing-customer-bank-card-header">
                    <span className="billing-customer-bank-name">{bank.name}</span>
                    {selectedBankId === bank.id && <span className="billing-customer-check-indicator">✓</span>}
                  </div>
                  <div className="billing-customer-bank-card-details">
                    <div className="billing-customer-detail-item">
                      <span>Account Name:</span>
                      <strong>{bank.accountName}</strong>
                    </div>
                    <div className="billing-customer-detail-item">
                      <span>Account Number:</span>
                      <strong>{bank.accountNumber}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {validationErrors.bank && (
              <span className="billing-customer-error-message">{validationErrors.bank}</span>
            )}
          </div>

          {selectedBank && (
            <div className="billing-customer-transfer-form">
              <h5>Payment Details</h5>

              <div className="billing-customer-form-row">
                <div className="billing-customer-form-group">
                  <label>Account Name (Optional)</label>
                  <input
                    type="text"
                    name="accountName"
                    defaultValue={manualTransferForm.accountName}
                    onBlur={handleManualTransferInputChange}
                    placeholder="Your full name as shown in transfer"
                    className={validationErrors.accountName ? 'error' : ''}
                  />
                  {validationErrors.accountName && (
                    <small className="billing-customer-error-message">{validationErrors.accountName}</small>
                  )}
                </div>
                <div className="billing-customer-form-group">
                  <label>Reference / Transaction ID *</label>
                  <input
                    type="text"
                    name="transactionReference"
                    defaultValue={manualTransferForm.transactionReference}
                    onBlur={handleManualTransferInputChange}
                    placeholder="Enter transaction reference number"
                    required
                    className={validationErrors.transactionReference ? 'error' : ''}
                  />
                  {validationErrors.transactionReference && (
                    <small className="billing-customer-hint-text">{validationErrors.transactionReference}</small>
                  )}
                </div>
              </div>

              <div className="billing-customer-form-row">
                <div className="billing-customer-form-group">
                  <label>Amount Sent *</label>
                  <input
                    type="number"
                    name="amount"
                    defaultValue={manualTransferForm.amount}
                    onBlur={handleManualTransferInputChange}
                    placeholder="Enter exact amount sent"
                    step="0.01"
                    required
                    className={validationErrors.amount ? 'error' : ''}
                  />
                  {validationErrors.amount && (
                    <small className="billing-customer-error-message">{validationErrors.amount}</small>
                  )}
                </div>
              </div>

              <div className="billing-customer-form-row">
                <div className="billing-customer-form-group">
                  <label>Transfer Date *</label>
                  <input
                    type="date"
                    name="transferDate"
                    defaultValue={manualTransferForm.transferDate}
                    onBlur={handleManualTransferInputChange}
                    required
                    className={validationErrors.transferDate ? 'error' : ''}
                    max={new Date().toISOString().split('T')[0]}
                    min={selectedItem?.date ? new Date(selectedItem.date).toISOString().split('T')[0] : undefined}
                  />
                  {validationErrors.transferDate && (
                    <span className="billing-customer-error-message">{validationErrors.transferDate}</span>
                  )}
                  <small className="billing-customer-hint-text">
                    Must be between {selectedItem?.date || 'invoice date'} and today
                  </small>
                </div>
                <div className="billing-customer-form-group">
                  <label>Transfer Time *</label>
                  <input
                    type="time"
                    name="transferTime"
                    defaultValue={manualTransferForm.transferTime}
                    onBlur={handleManualTransferInputChange}
                    required
                    className={validationErrors.transferTime ? 'error' : ''}
                  />
                  {validationErrors.transferTime && (
                    <span className="billing-customer-error-message">{validationErrors.transferTime}</span>
                  )}
                </div>
              </div>

              <div className="billing-customer-form-group">
                <label>Upload Proof of Payment *</label>
                <div className={`billing-customer-file-upload-area ${validationErrors.proofFile ? 'error' : ''}`}>
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleProofFileChange}
                    required
                  />
                  {proofFile ? (
                    <span className="billing-customer-file-name">
                      {proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)
                    </span>
                  ) : (
                    <>
                      <span className="upload-icon">📤</span>
                      <small>Click or drag to upload</small>
                    </>
                  )}
                </div>
                {validationErrors.proofFile && (
                  <span className="billing-customer-error-message">{validationErrors.proofFile}</span>
                )}
              </div>

              <div className="billing-customer-form-group">
                <label>Remarks (Optional)</label>
                <textarea
                  name="remarks"
                  defaultValue={manualTransferForm.remarks}
                  onBlur={handleManualTransferInputChange}
                  placeholder="Additional notes for the admin"
                  rows="2"
                />
              </div>

              <button
                className="billing-customer-submit-transfer-btn"
                onClick={handleSubmitManualTransfer}
                disabled={isSubmittingManual}
              >
                {isSubmittingManual ? 'Submitting...' : 'Submit for Verification'}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SkeletonLoader = () => (
    <div className="billing-customer-container">
      <div className="billing-customer-skeleton-header"></div>
      <div className="billing-customer-skeleton-tabs"></div>
      <div className="billing-customer-skeleton-filters"></div>
      <div className="billing-customer-skeleton-table"></div>
    </div>
  );

  const stats = getStatistics();
  const filteredItems = getFilteredItems();

  const getTabItems = (tab) => {
    if (tab === 'all') return filteredItems;
    if (tab === 'pre-assessment') return filteredItems.filter(item => item.type === 'pre-assessment');
    if (tab === 'project') return filteredItems.filter(item => item.type === 'project');
    if (tab === 'pending') return filteredItems.filter(item => item.status === 'pending' || item.status === 'pending_payment');
    if (tab === 'paid') return filteredItems.filter(item => item.status === 'paid');
    if (tab === 'for_verification') return filteredItems.filter(item => item.status === 'for_verification');
    return filteredItems;
  };

  const getVisibleItems = (items) => {
    return items.filter(item => {
      if (item.type === 'project' && (item.status === 'pending' || item.status === 'pending_payment')) {
        return !isPayNowDisabled(item);
      }
      if (item.type === 'pre-assessment' && (item.status === 'pending' || item.status === 'pending_payment')) {
        return true;
      }
      return true;
    });
  };

  const tabItems = getVisibleItems(getTabItems(activeTab));

  // =========================================
  // FIXED: DROPDOWN POSITIONING
  // =========================================

  const toggleDropdown = (itemId, event) => {
    if (activeDropdown === itemId) {
      setActiveDropdown(null);
    } else {
      const rect = event.currentTarget.getBoundingClientRect();

      const dropdownHeight = 180;
      const dropdownWidth = 220;

      // Use viewport coordinates directly (no scroll offset)
      let top = rect.bottom + 4;
      let left = rect.left;

      // Calculate available space below and above in the viewport
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Flip above if not enough space below
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        top = rect.top - dropdownHeight - 4;
      }

      // Keep dropdown within viewport horizontally
      if (left + dropdownWidth > window.innerWidth) {
        left = Math.max(10, window.innerWidth - dropdownWidth - 10);
      }

      // Keep dropdown within viewport vertically
      if (top < 10) {
        top = 10;
      }
      if (top + dropdownHeight > window.innerHeight - 10) {
        top = window.innerHeight - dropdownHeight - 10;
      }

      setDropdownPosition({ top, left });
      setActiveDropdown(itemId);
    }
  };

  // Recalculate dropdown position on scroll when dropdown is open
  useEffect(() => {
    if (activeDropdown === null) return;

    const handleScroll = () => {
      // Find the active button element
      const triggerButtons = document.querySelectorAll('.billing-customer-dropdown-trigger-btn');
      let activeButton = null;
      triggerButtons.forEach(btn => {
        if (btn.closest('.billing-customer-dropdown-menu-container')) {
          const container = btn.closest('.billing-customer-dropdown-menu-container');
          if (container && container.querySelector('.billing-customer-dropdown-menu')) {
            activeButton = btn;
          }
        }
      });

      if (!activeButton) return;

      const rect = activeButton.getBoundingClientRect();
      const dropdownHeight = 180;
      const dropdownWidth = 220;

      let top = rect.bottom + 4;
      let left = rect.left;

      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;

      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        top = rect.top - dropdownHeight - 4;
      }

      if (left + dropdownWidth > window.innerWidth) {
        left = Math.max(10, window.innerWidth - dropdownWidth - 10);
      }

      if (top < 10) {
        top = 10;
      }
      if (top + dropdownHeight > window.innerHeight - 10) {
        top = window.innerHeight - dropdownHeight - 10;
      }

      setDropdownPosition({ top, left });
    };

    window.addEventListener('scroll', handleScroll, true);
    window.addEventListener('resize', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleScroll);
    };
  }, [activeDropdown]);

  // Auto-close dropdown on scroll
  useEffect(() => {
    if (activeDropdown === null) return;

    const handleScroll = () => {
      setActiveDropdown(null);
    };

    window.addEventListener('scroll', handleScroll, true);

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [activeDropdown]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (activeDropdown !== null) {
        const dropdowns = document.querySelectorAll('.billing-customer-dropdown-menu-container');
        let isOutside = true;
        dropdowns.forEach(dropdown => {
          if (dropdown.contains(event.target)) {
            isOutside = false;
          }
        });
        if (isOutside) {
          setActiveDropdown(null);
        }
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [activeDropdown]);

  // Success Page Component
  const SuccessPageContent = () => (
    <div className="billing-customer-success-page-content">
      <Helmet>
        <title>Payment Successful | Salfer Engineering</title>
      </Helmet>

      <div className="billing-customer-success-page-card">
        <div className="billing-customer-success-page-icon">
          <span className="billing-customer-success-page-checkmark">✓</span>
        </div>

        <h1 className="billing-customer-success-page-title">
          {successMessage}
        </h1>

        <div className="billing-customer-success-page-details">
          <h2 className="billing-customer-success-page-subtitle">
            {successDetails?.title}
          </h2>
          <p className="billing-customer-success-page-message">
            {successDetails?.message}
          </p>
          {successDetails?.reference && (
            <div className="billing-customer-success-page-reference">
              <span className="billing-customer-success-page-ref-label">Reference Number:</span>
              <span className="billing-customer-success-page-ref-value">{successDetails.reference}</span>
            </div>
          )}
        </div>

        <div className="billing-customer-success-page-actions">
          <button
            className="billing-customer-success-page-btn"
            onClick={closeSuccessPage}
          >
            Return to Billing
          </button>
        </div>
      </div>
    </div>
  );

  // Processing Modal
  const ProcessingModal = () => (
    <div className="billing-customer-processing-overlay">
      <div className="billing-customer-processing-modal">
        <div className="billing-customer-processing-spinner-circle"></div>
        <p className="billing-customer-processing-message">{processingMessage}</p>
        <p className="billing-customer-processing-submessage">Please do not close this window</p>
      </div>
    </div>
  );

  if (showSuccessPage) {
    return <SuccessPageContent />;
  }

  if (loading) {
    return (
      <>
        <Helmet><title>My Solar Journey | Salfer Engineering</title></Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet><title>My Solar Journey | Salfer Engineering</title></Helmet>

      {showProcessingModal && <ProcessingModal />}

      <div className="billing-customer-container">

        {/* STATS CARDS - 4 IN A ROW */}
        <div className="billing-customer-stats-grid">
          <div className="billing-customer-stat-card">
            <div className="billing-customer-stat-label">Total Transactions</div>
            <div className="billing-customer-stat-value">{stats.totalItems}</div>
            <div className="billing-customer-stat-sub">All time</div>
          </div>
          <div className="billing-customer-stat-card">
            <div className="billing-customer-stat-label">Pending</div>
            <div className="billing-customer-stat-value">{stats.pendingItems}</div>
            <div className="billing-customer-stat-sub">{formatCurrency(stats.pendingAmount)}</div>
          </div>
          <div className="billing-customer-stat-card">
            <div className="billing-customer-stat-label">Paid</div>
            <div className="billing-customer-stat-value">{stats.paidItems}</div>
            <div className="billing-customer-stat-sub">Completed</div>
          </div>
          <div className="billing-customer-stat-card">
            <div className="billing-customer-stat-label">For Verification</div>
            <div className="billing-customer-stat-value">{stats.forVerificationItems}</div>
            <div className="billing-customer-stat-sub">Pending review</div>
          </div>
        </div>

        {/* TABS - WITHOUT BADGES/NUMBERS */}
        <div className="billing-customer-tabs">
          <button
            className={`billing-customer-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button
            className={`billing-customer-tab-btn ${activeTab === 'pre-assessment' ? 'active' : ''}`}
            onClick={() => setActiveTab('pre-assessment')}
          >
            Pre-Assessments
          </button>
          <button
            className={`billing-customer-tab-btn ${activeTab === 'project' ? 'active' : ''}`}
            onClick={() => setActiveTab('project')}
          >
            Project Bills
          </button>
          <button
            className={`billing-customer-tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            Pending
          </button>
          <button
            className={`billing-customer-tab-btn ${activeTab === 'paid' ? 'active' : ''}`}
            onClick={() => setActiveTab('paid')}
          >
            Paid
          </button>
          <button
            className={`billing-customer-tab-btn ${activeTab === 'for_verification' ? 'active' : ''}`}
            onClick={() => setActiveTab('for_verification')}
          >
            Verifying
          </button>
        </div>

        {/* FILTERS */}
        <div className="billing-customer-filters">
          <div className="billing-customer-filter-group">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="for_verification">For Verification</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="billing-customer-search-group">
            <input
              type="text"
              placeholder="Search by reference, invoice, or project..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button className="billing-customer-clear-search" onClick={() => setSearchTerm('')}>×</button>
            )}
          </div>

          {(typeFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
            <button className="billing-customer-clear-filters-btn" onClick={() => {
              setTypeFilter('all');
              setStatusFilter('all');
              setSearchTerm('');
            }}>
              Clear
            </button>
          )}
        </div>

        <div className="billing-customer-results-count">
          <p>Showing {tabItems.length} of {filteredItems.length} transaction(s)</p>
        </div>

        {/* TABLE CONTAINER - Desktop */}
        <div className="billing-customer-table-container">
          <div className="billing-customer-table-wrapper">
            {tabItems.length === 0 ? (
              <div className="billing-customer-empty-state">
                <h3>No transactions found</h3>
                <p>Try adjusting your filters or search criteria.</p>
              </div>
            ) : (
              <table className="billing-customer-table">
                <thead>
                  <tr>
                    <th>Transaction</th>
                    <th>Reference</th>
                    <th>Date</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tabItems.map((item, index) => {
                    const isPreAssessment = item.type === 'pre-assessment';
                    const isPaid = item.status === 'paid';
                    const isPending = item.status === 'pending' || item.status === 'pending_payment';
                    const isVerifying = item.status === 'for_verification';
                    const isPayNowButtonDisabled = isPayNowDisabled(item);
                    const hasReceipt = item.receiptUrl;
                    const isDropdownOpen = activeDropdown === item.id;

                    return (
                      <tr key={index} className={`billing-customer-table-row ${item.type}`}>
                        <td>
                          <div className="billing-customer-transaction-cell">
                            <div>
                              <div className="billing-customer-transaction-name">{item.description}</div>
                              {!isPreAssessment && item.invoiceType && (
                                <span className={`billing-customer-invoice-type-label ${item.invoiceType}`}>
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <div className="billing-customer-reference-cell">
                            <span className="billing-customer-ref-id">{isPreAssessment ? item.bookingReference || item.id : item.id}</span>
                          </div>
                        </td>
                        <td>{item.date}</td>
                        <td>
                          <div className="billing-customer-amount-cell">
                            <span className="billing-customer-amount-main">{formatCurrency(item.amount)}</span>
                            {item.paymentStatus === 'partial' && (
                              <span className="billing-customer-amount-balance">Balance: {formatCurrency(item.balance)}</span>
                            )}
                          </div>
                        </td>
                        <td>{getStatusBadge(item.status)}</td>
                        <td>
                          <div className="billing-customer-action-cell">
                            {isPending ? (
                              !isPayNowButtonDisabled ? (
                                <button
                                  className="billing-customer-paynow-btn"
                                  onClick={() => handlePayNowClick(item)}
                                  disabled={isSubmitting}
                                >
                                  Pay Now
                                </button>
                              ) : (
                                <span className="billing-customer-no-action">—</span>
                              )
                            ) : isVerifying ? (
                              // For verification status - show dropdown with only View Details
                              <div className="billing-customer-dropdown-menu-container">
                                <button
                                  className="billing-customer-dropdown-trigger-btn"
                                  onClick={(e) => toggleDropdown(item.id, e)}
                                >
                                  Action ▾
                                </button>

                                {isDropdownOpen && (
                                  <div
                                    className="billing-customer-dropdown-menu"
                                    style={{
                                      position: 'fixed',
                                      top: dropdownPosition.top + 'px',
                                      left: dropdownPosition.left + 'px',
                                      zIndex: 99999,
                                    }}
                                  >
                                    <button
                                      className="billing-customer-dropdown-item view-details"
                                      onClick={() => {
                                        setActiveDropdown(null);
                                        handleViewDetails(item);
                                      }}
                                    >
                                      View Details
                                    </button>
                                  </div>
                                )}
                              </div>
                            ) : isPaid ? (
                              // For paid status - show dropdown with all actions
                              <div className="billing-customer-dropdown-menu-container">
                                <button
                                  className="billing-customer-dropdown-trigger-btn"
                                  onClick={(e) => toggleDropdown(item.id, e)}
                                >
                                  Action ▾
                                </button>

                                {isDropdownOpen && (
                                  <div
                                    className="billing-customer-dropdown-menu"
                                    style={{
                                      position: 'fixed',
                                      top: dropdownPosition.top + 'px',
                                      left: dropdownPosition.left + 'px',
                                      zIndex: 99999,
                                    }}
                                  >
                                    <button
                                      className="billing-customer-dropdown-item view-details"
                                      onClick={() => {
                                        setActiveDropdown(null);
                                        handleViewDetails(item);
                                      }}
                                    >
                                      View Details
                                    </button>

                                    {hasReceipt && (
                                      <>
                                        <button
                                          className="billing-customer-dropdown-item view-receipt"
                                          onClick={() => {
                                            setActiveDropdown(null);
                                            handleViewReceipt(item);
                                          }}
                                        >
                                          View Receipt
                                        </button>
                                        <button
                                          className="billing-customer-dropdown-item download-receipt"
                                          onClick={() => {
                                            setActiveDropdown(null);
                                            handleDownloadReceipt(item);
                                          }}
                                        >
                                          Download Receipt
                                        </button>
                                      </>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="billing-customer-status-text">{item.status}</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* MOBILE CARDS */}
        <div className="billing-customer-mobile-cards">
          {tabItems.length === 0 ? (
            <div className="billing-customer-empty-state">
              <h3>No transactions found</h3>
              <p>Try adjusting your filters or search criteria.</p>
            </div>
          ) : (
            tabItems.map((item, index) => {
              const isPreAssessment = item.type === 'pre-assessment';
              const isPaid = item.status === 'paid';
              const isPending = item.status === 'pending' || item.status === 'pending_payment';
              const isVerifying = item.status === 'for_verification';
              const isPayNowButtonDisabled = isPayNowDisabled(item);
              const hasReceipt = item.receiptUrl;
              const isDropdownOpen = activeDropdown === item.id;

              return (
                <div key={index} className="billing-customer-mobile-card">
                  <div className="billing-customer-mobile-card-header">
                    <div className="billing-customer-mobile-card-title">
                      <span className="billing-customer-ref-id">{isPreAssessment ? item.bookingReference || item.id : item.id}</span>
                      {item.projectName && <span className="billing-customer-ref-project">{item.projectName}</span>}
                    </div>
                    <div className="billing-customer-mobile-card-status">
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <div className="billing-customer-mobile-card-body">
                    <div className="billing-customer-mobile-card-item">
                      <span className="billing-customer-label">Transaction</span>
                      <span className="billing-customer-value">{item.description}</span>
                    </div>
                    <div className="billing-customer-mobile-card-item">
                      <span className="billing-customer-label">Amount</span>
                      <span className="billing-customer-value">
                        <span className="billing-customer-amount-main">{formatCurrency(item.amount)}</span>
                        {item.paymentStatus === 'partial' && (
                          <span className="billing-customer-amount-balance">Balance: {formatCurrency(item.balance)}</span>
                        )}
                      </span>
                    </div>
                    <div className="billing-customer-mobile-card-item">
                      <span className="billing-customer-label">Date</span>
                      <span className="billing-customer-value">{item.date}</span>
                    </div>
                    <div className="billing-customer-mobile-card-item">
                      <span className="billing-customer-label">Due Date</span>
                      <span className="billing-customer-value">{item.dueDate}</span>
                    </div>
                  </div>

                  <div className="billing-customer-mobile-card-footer">
                    <div className="billing-customer-transaction-info">
                      <span className="billing-customer-transaction-name">{item.description}</span>
                    </div>
                    {isPending ? (
                      !isPayNowButtonDisabled ? (
                        <button
                          className="billing-customer-paynow-btn"
                          onClick={() => handlePayNowClick(item)}
                          disabled={isSubmitting}
                        >
                          Pay Now
                        </button>
                      ) : (
                        <span className="billing-customer-no-action">—</span>
                      )
                    ) : isVerifying ? (
                      // For verification status - show dropdown with only View Details
                      <div className="billing-customer-dropdown-menu-container">
                        <button
                          className="billing-customer-dropdown-trigger-btn"
                          onClick={(e) => toggleDropdown(item.id, e)}
                        >
                          Action ▾
                        </button>

                        {isDropdownOpen && (
                          <div
                            className="billing-customer-dropdown-menu"
                            style={{
                              position: 'fixed',
                              top: dropdownPosition.top + 'px',
                              left: dropdownPosition.left + 'px',
                              zIndex: 99999,
                            }}
                          >
                            <button
                              className="billing-customer-dropdown-item view-details"
                              onClick={() => {
                                setActiveDropdown(null);
                                handleViewDetails(item);
                              }}
                            >
                              View Details
                            </button>
                          </div>
                        )}
                      </div>
                    ) : isPaid ? (
                      // For paid status - show dropdown with all actions
                      <div className="billing-customer-dropdown-menu-container">
                        <button
                          className="billing-customer-dropdown-trigger-btn"
                          onClick={(e) => toggleDropdown(item.id, e)}
                        >
                          Action ▾
                        </button>

                        {isDropdownOpen && (
                          <div
                            className="billing-customer-dropdown-menu"
                            style={{
                              position: 'fixed',
                              top: dropdownPosition.top + 'px',
                              left: dropdownPosition.left + 'px',
                              zIndex: 99999,
                            }}
                          >
                            <button
                              className="billing-customer-dropdown-item view-details"
                              onClick={() => {
                                setActiveDropdown(null);
                                handleViewDetails(item);
                              }}
                            >
                              View Details
                            </button>

                            {hasReceipt && (
                              <>
                                <button
                                  className="billing-customer-dropdown-item view-receipt"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    handleViewReceipt(item);
                                  }}
                                >
                                  View Receipt
                                </button>
                                <button
                                  className="billing-customer-dropdown-item download-receipt"
                                  onClick={() => {
                                    setActiveDropdown(null);
                                    handleDownloadReceipt(item);
                                  }}
                                >
                                  Download Receipt
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="billing-customer-status-text">{item.status}</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* FULL PAYMENT MODAL */}
        {showFullPaymentModal && selectedItem && (
          <div className="billing-customer-modal-overlay" onClick={closeFullPaymentModal}>
            <div className="billing-customer-modal billing-customer-payment-modal" onClick={e => e.stopPropagation()}>
              <button className="billing-customer-modal-close" onClick={closeFullPaymentModal}>×</button>
              <h3>Pay Invoice</h3>
              <div className="billing-customer-modal-scroll-content" ref={scrollContainerRef}>
                <div className="billing-customer-payment-summary">
                  <p><strong>Invoice:</strong> {selectedItem.invoiceNumber}</p>
                  <p><strong>Project:</strong> {selectedItem.projectName}</p>
                  <p><strong>Amount Due:</strong> {formatCurrency(selectedItem.balance || selectedItem.totalAmount)}</p>
                </div>

                <div className="billing-customer-payment-methods">
                  <h4>Payment Method</h4>
                  <div className="billing-customer-method-options">
                    <div className={`billing-customer-method-option ${paymentMethod === 'gcash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('gcash')}>
                      <input type="radio" checked={paymentMethod === 'gcash'} readOnly />
                      <div><strong>GCash</strong><small>Upload receipt</small></div>
                    </div>
                    <div className={`billing-customer-method-option ${paymentMethod === 'paymongo_card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('paymongo_card')}>
                      <input type="radio" checked={paymentMethod === 'paymongo_card'} readOnly />
                      <div><strong>Credit/Debit Card</strong><small>Instant payment</small></div>
                    </div>
                    <div className={`billing-customer-method-option ${paymentMethod === 'manual_bank_transfer' ? 'selected' : ''}`} onClick={() => setPaymentMethod('manual_bank_transfer')}>
                      <input type="radio" checked={paymentMethod === 'manual_bank_transfer'} readOnly />
                      <div><strong>Bank Transfer</strong><small>Manual transfer with proof</small></div>
                    </div>
                    <div className={`billing-customer-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                      <input type="radio" checked={paymentMethod === 'cash'} readOnly />
                      <div><strong>Cash</strong><small>Pay at office</small></div>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'gcash' && (
                  <div className="billing-customer-payment-form">
                    <div className="billing-customer-gcash-details">
                      <h4>GCash Details</h4>
                      <p>Number: <strong>0917XXXXXXX</strong></p>
                      <p>Name: <strong>SALFER ENGINEERING CORP</strong></p>
                    </div>
                    <div className="billing-customer-form-group">
                      <label>Reference Number</label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={handlePaymentReferenceChange}
                        placeholder="Enter reference"
                      />
                    </div>
                    <div className="billing-customer-form-group">
                      <label>Upload Screenshot</label>
                      <input type="file" accept="image/*" onChange={handlePaymentProofChange} />
                    </div>
                    <button className="billing-customer-confirm-btn" onClick={handleFullPaymentSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : 'Submit'}
                    </button>
                  </div>
                )}

                {paymentMethod === 'paymongo_card' && (
                  <div className="billing-customer-payment-form">
                    <div className="billing-customer-card-form">
                      <div className="billing-customer-form-group">
                        <label>Card Number</label>
                        <input
                          type="text"
                          id="full-card-number"
                          placeholder="4343 4343 4343 4345"
                          maxLength="19"
                          onInput={handleCardNumberInput}
                          autoComplete="cc-number"
                        />
                      </div>
                      <div className="billing-customer-form-row">
                        <div className="billing-customer-form-group">
                          <label>Expiry</label>
                          <input
                            type="text"
                            id="full-card-expiry"
                            placeholder="MM/YY"
                            maxLength="5"
                            onInput={handleExpiryInput}
                            autoComplete="cc-exp"
                          />
                        </div>
                        <div className="billing-customer-form-group">
                          <label>CVC</label>
                          <input
                            type="text"
                            id="full-card-cvc"
                            placeholder="123"
                            maxLength="3"
                            onInput={handleCVCInput}
                            autoComplete="cc-csc"
                          />
                        </div>
                      </div>
                      <button className="billing-customer-paymongo-btn" onClick={handleProjectPayMongoCardPayment} disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(selectedItem.balance || selectedItem.totalAmount)}`}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'manual_bank_transfer' && <ManualBankTransferSection />}

                {paymentMethod === 'cash' && (
                  <div className="billing-customer-payment-form">
                    <div className="billing-customer-cash-details">
                      <div className="billing-customer-info-box">
                        <strong>Office Address</strong>
                        <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                        <p>Mon-Fri, 8AM-5PM</p>
                      </div>
                      <button className="billing-customer-confirm-btn" onClick={handleFullPaymentSubmit} disabled={isSubmitting}>
                        Confirm Cash Payment
                      </button>
                    </div>
                  </div>
                )}

                <div className="billing-customer-modal-actions">
                  <button className="billing-customer-cancel-btn" onClick={closeFullPaymentModal}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT MODAL (Pre-assessment) */}
        {showPaymentModal && selectedItem && (
          <div className="billing-customer-modal-overlay" onClick={closeModal}>
            <div className="billing-customer-modal billing-customer-payment-modal" onClick={e => e.stopPropagation()}>
              <button className="billing-customer-modal-close" onClick={closeModal}>×</button>
              <h3>Make Payment</h3>
              <div className="billing-customer-modal-scroll-content" ref={scrollContainerRef}>
                <div className="billing-customer-payment-summary">
                  <p><strong>Invoice:</strong> {selectedItem.invoiceNumber || selectedItem.id}</p>
                  <p><strong>Amount:</strong> {formatCurrency(selectedItem.amount)}</p>
                </div>

                <div className="billing-customer-payment-methods">
                  <h4>Payment Method</h4>
                  <div className="billing-customer-method-options">
                    <div className={`billing-customer-method-option ${paymentMethod === 'gcash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('gcash')}>
                      <input type="radio" checked={paymentMethod === 'gcash'} readOnly />
                      <div><strong>GCash</strong><small>Upload receipt</small></div>
                    </div>
                    <div className={`billing-customer-method-option ${paymentMethod === 'paymongo_card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('paymongo_card')}>
                      <input type="radio" checked={paymentMethod === 'paymongo_card'} readOnly />
                      <div><strong>Card</strong><small>Instant</small></div>
                    </div>
                    <div className={`billing-customer-method-option ${paymentMethod === 'manual_bank_transfer' ? 'selected' : ''}`} onClick={() => setPaymentMethod('manual_bank_transfer')}>
                      <input type="radio" checked={paymentMethod === 'manual_bank_transfer'} readOnly />
                      <div><strong>Bank Transfer</strong><small>Manual with proof</small></div>
                    </div>
                    <div className={`billing-customer-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                      <input type="radio" checked={paymentMethod === 'cash'} readOnly />
                      <div><strong>Cash</strong><small>Office</small></div>
                    </div>
                  </div>
                </div>

                {paymentMethod === 'gcash' && (
                  <div className="billing-customer-payment-form">
                    <div className="billing-customer-gcash-details">
                      <h4>GCash Details</h4>
                      <p>Number: <strong>0917XXXXXXX</strong></p>
                      <p>Name: <strong>SALFER ENGINEERING CORP</strong></p>
                    </div>
                    <div className="billing-customer-form-group">
                      <label>Reference</label>
                      <input
                        type="text"
                        value={paymentReference}
                        onChange={handlePaymentReferenceChange}
                      />
                    </div>
                    <div className="billing-customer-form-group">
                      <label>Screenshot</label>
                      <input type="file" accept="image/*" onChange={handlePaymentProofChange} />
                    </div>
                    <button className="billing-customer-confirm-btn" onClick={handlePaymentSubmit} disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : 'Submit'}
                    </button>
                  </div>
                )}

                {paymentMethod === 'paymongo_card' && (
                  <div className="billing-customer-payment-form">
                    <div className="billing-customer-card-form">
                      <div className="billing-customer-form-group">
                        <label>Card Number</label>
                        <input
                          type="text"
                          id="card-number"
                          placeholder="1234 5678 9012 3456"
                          maxLength="19"
                          onInput={handleCardNumberInput}
                          autoComplete="cc-number"
                        />
                      </div>
                      <div className="billing-customer-form-row">
                        <div className="billing-customer-form-group">
                          <label>Expiry</label>
                          <input
                            type="text"
                            id="card-expiry"
                            placeholder="MM/YY"
                            maxLength="5"
                            onInput={handleExpiryInput}
                            autoComplete="cc-exp"
                          />
                        </div>
                        <div className="billing-customer-form-group">
                          <label>CVC</label>
                          <input
                            type="text"
                            id="card-cvc"
                            placeholder="123"
                            maxLength="3"
                            onInput={handleCVCInput}
                            autoComplete="cc-csc"
                          />
                        </div>
                      </div>
                      <button className="billing-customer-paymongo-btn" onClick={handlePayMongoCardPayment} disabled={isSubmitting}>
                        {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(selectedItem.amount)}`}
                      </button>
                    </div>
                  </div>
                )}

                {paymentMethod === 'manual_bank_transfer' && <ManualBankTransferSection />}

                {paymentMethod === 'cash' && (
                  <div className="billing-customer-payment-form">
                    <div className="billing-customer-cash-details">
                      <div className="billing-customer-info-box">
                        <strong>Office Address</strong>
                        <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                      </div>
                      <button className="billing-customer-confirm-btn" onClick={handleCashPaymentSubmit} disabled={isSubmitting}>
                        Confirm
                      </button>
                    </div>
                  </div>
                )}

                <div className="billing-customer-modal-actions">
                  <button className="billing-customer-cancel-btn" onClick={closeModal}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS MODAL */}
        {showDetailsModal && detailsItem && (
          <div className="billing-customer-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="billing-customer-modal billing-customer-details-modal" onClick={e => e.stopPropagation()}>
              <button className="billing-customer-modal-close" onClick={() => setShowDetailsModal(false)}>×</button>
              <h3>Transaction Details</h3>
              <div className="billing-customer-modal-scroll-content" ref={scrollContainerRef}>
                <div className="billing-customer-details-content">
                  {detailsItem.bookingReference ? (
                    <>
                      <div className="billing-customer-details-section">
                        <h4>Booking Information</h4>
                        <p><strong>Reference:</strong> {detailsItem.bookingReference}</p>
                        <p><strong>Status:</strong> {detailsItem.paymentStatus || detailsItem.status}</p>
                        <p><strong>Amount:</strong> {formatCurrency(detailsItem.amount)}</p>
                        <p><strong>Date:</strong> {detailsItem.date}</p>
                        <p><strong>Due Date:</strong> {detailsItem.dueDate}</p>
                      </div>
                      <div className="billing-customer-details-section">
                        <h4>Assessment Details</h4>
                        <p><strong>Property Type:</strong> {detailsItem.propertyType || 'N/A'}</p>
                        <p><strong>Desired Capacity:</strong> {detailsItem.desiredCapacity ? `${detailsItem.desiredCapacity} kW` : 'N/A'}</p>
                        <p><strong>Roof Type:</strong> {detailsItem.roofType || 'N/A'}</p>
                        <p><strong>Address:</strong> {formatAddress(detailsItem.address)}</p>
                      </div>
                      {detailsItem.systemSize && (
                        <div className="billing-customer-details-section">
                          <h4>Quotation Details</h4>
                          <p><strong>System Size:</strong> {detailsItem.systemSize} kWp</p>
                          <p><strong>System Type:</strong> {detailsItem.systemType || 'N/A'}</p>
                          <p><strong>Panels Needed:</strong> {detailsItem.panelsNeeded || 'N/A'}</p>
                          <p><strong>Total Cost:</strong> {formatCurrency(detailsItem.totalCost)}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="billing-customer-details-section">
                        <h4>Bill Information</h4>
                        <p><strong>Invoice:</strong> {detailsItem.id}</p>
                        <p><strong>Project:</strong> {detailsItem.projectName || 'N/A'}</p>
                        <p><strong>Status:</strong> {detailsItem.status}</p>
                        <p><strong>Date:</strong> {detailsItem.date}</p>
                        <p><strong>Due Date:</strong> {detailsItem.dueDate}</p>
                        {detailsItem.invoiceType && (
                          <p><strong>Invoice Type:</strong> {getInvoiceTypeLabel(detailsItem)}</p>
                        )}
                      </div>
                      <div className="billing-customer-details-section">
                        <h4>Payment Details</h4>
                        <p><strong>Total:</strong> {formatCurrency(detailsItem.totalAmount || detailsItem.amount)}</p>
                        {detailsItem.amountPaid > 0 && <p><strong>Paid:</strong> {formatCurrency(detailsItem.amountPaid)}</p>}
                        {detailsItem.balance > 0 && <p><strong>Balance:</strong> {formatCurrency(detailsItem.balance)}</p>}
                      </div>
                    </>
                  )}
                </div>
                <div className="billing-customer-modal-actions">
                  <button className="billing-customer-cancel-btn" onClick={() => setShowDetailsModal(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default Quotation;