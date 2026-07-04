// pages/Customer/Quotation.cuspro.jsx - Redesigned
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Customer/quotation.css';
import {
  FaCalendarAlt, FaProjectDiagram, FaClock, FaCheckCircle,
  FaEye, FaDownload, FaMoneyBillWave, FaCreditCard, FaSpinner,
  FaTimes, FaFileInvoice, FaFilter, FaSearch, FaHome,
  FaBuilding, FaSyncAlt, FaWallet, FaReceipt, FaUniversity,
  FaChevronDown, FaChevronUp, FaCheck, FaArrowLeft
} from 'react-icons/fa';

const Quotation = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);
  const [showFullPaymentModal, setShowFullPaymentModal] = useState(false);
  const [acceptingLoading, setAcceptingLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedPaymentPreference, setSelectedPaymentPreference] = useState('installment');

  // Manual Bank Transfer States
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

  // Filter states
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [freeQuotes, setFreeQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);
  const [solarInvoices, setSolarInvoices] = useState([]);
  const [allItems, setAllItems] = useState([]);

  // Company bank accounts for manual transfer
  const companyBanks = [
    { id: 'bpi', name: 'BPI', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'unionbank', name: 'UnionBank', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'bdo', name: 'BDO', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'metrobank', name: 'Metrobank', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'landbank', name: 'Landbank', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'security_bank', name: 'Security Bank', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'chinabank', name: 'China Bank', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'pnb', name: 'PNB', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'eastwest', name: 'EastWest Bank', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' },
    { id: 'rcbc', name: 'RCBC', accountName: 'SALFER ENGINEERING CORP', accountNumber: '1234-5678-9012' }
  ];

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
          icon: <FaHome />,
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
            invoice.paymentStatus === 'overdue' ? 'overdue' : 'pending',
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
        icon: <FaBuilding />,
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

  // Helper functions for payment plans (keep all existing helpers)
  const getProjectPaymentPlan = (projectId) => {
    const project = projects.find(p => p._id?.toString() === projectId?.toString());
    return project?.paymentPreference || 'installment';
  };

  const isDownpaymentCompleted = (projectId) => {
    const projectInvoices = allItems.filter(item =>
      item.type === 'project' &&
      item.projectId === projectId
    );
    const downpaymentInvoice = projectInvoices.find(inv => inv.invoiceType === 'downpayment');
    return downpaymentInvoice && downpaymentInvoice.status === 'paid';
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

  // Manual Bank Transfer Handlers
  const handleManualTransferInputChange = (e) => {
    const { name, value } = e.target;
    setManualTransferForm(prev => ({ ...prev, [name]: value }));
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
    if (!selectedBankId) {
      showToast('Please select a bank', 'warning');
      return;
    }
    if (!manualTransferForm.transactionReference) {
      showToast('Please enter transaction reference number', 'warning');
      return;
    }
    if (!manualTransferForm.amount || parseFloat(manualTransferForm.amount) <= 0) {
      showToast('Please enter a valid amount', 'warning');
      return;
    }
    if (!manualTransferForm.transferDate) {
      showToast('Please select transfer date', 'warning');
      return;
    }
    if (!manualTransferForm.transferTime) {
      showToast('Please select transfer time', 'warning');
      return;
    }
    if (!proofFile) {
      showToast('Please upload proof of payment', 'warning');
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
        setShowSuccessModal(true);
        
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

  // Card Payment Handlers
  const handlePayMongoCardPayment = async () => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const cardNumber = document.getElementById('card-number')?.value.replace(/\s/g, '');
      const cardExpiry = document.getElementById('card-expiry')?.value;
      const cardCvc = document.getElementById('card-cvc')?.value;

      if (!cardNumber || !cardExpiry || !cardCvc) {
        showToast('Please fill in all card details', 'warning');
        setIsSubmitting(false);
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
        setShowSuccessModal(true);
        closeModal();
        fetchData();
      } else {
        showToast(paymentResponse.data.message || 'Payment failed', 'error');
      }
    } catch (err) {
      console.error('Card payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process card payment', 'error');
    } finally {
      setIsSubmitting(false);
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
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const cardNumber = document.getElementById('full-card-number')?.value.replace(/\s/g, '');
      const cardExpiry = document.getElementById('full-card-expiry')?.value;
      const cardCvc = document.getElementById('full-card-cvc')?.value;

      if (!cardNumber || !cardExpiry || !cardCvc) {
        showToast('Please fill in all card details', 'warning');
        setIsSubmitting(false);
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
        setShowSuccessModal(true);
        closeFullPaymentModal();
        fetchData();
      } else {
        showToast(paymentResponse.data.message || 'Payment failed', 'error');
      }
    } catch (err) {
      console.error('Project card payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process card payment', 'error');
    } finally {
      setIsSubmitting(false);
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
  };

  const handleViewDetails = (item) => {
    setDetailsItem(item);
    setShowDetailsModal(true);
  };

  const handleViewQuotation = async (assessment) => {
    if (!assessment.quotationUrl) {
      showToast('No quotation PDF available for this assessment', 'warning');
      return;
    }
    window.open(assessment.quotationUrl, '_blank');
  };

  const handleDownloadQuotation = async (assessment) => {
    if (!assessment.quotationUrl) {
      showToast('No quotation PDF available for this assessment', 'warning');
      return;
    }
    setPdfLoading(true);
    try {
      const response = await axios.get(assessment.quotationUrl, { responseType: 'blob' });
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Quotation_${assessment.bookingReference || assessment.id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      showToast('Quotation downloaded successfully!', 'success');
    } catch (err) {
      console.error('Error downloading PDF:', err);
      showToast('Failed to download quotation', 'error');
    } finally {
      setPdfLoading(false);
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
    }

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
        setSuccessMessage('Payment Submitted!');
        setSuccessDetails({
          title: 'Payment Submitted for Verification',
          message: 'Your payment has been submitted and is now pending verification.',
          reference: selectedItem.bookingReference
        });
        setShowSuccessModal(true);
        closeModal();
        await fetchData();
      } else if (paymentMethod === 'cash') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/cash-payment`, {
          bookingReference: selectedItem.bookingReference
        }, { headers: { Authorization: `Bearer ${token}` } });
        setSuccessMessage('Cash Payment Selected!');
        setSuccessDetails({
          title: 'Cash Payment Option',
          message: 'Please visit our office to complete your payment.',
          reference: selectedItem.bookingReference
        });
        setShowSuccessModal(true);
        closeModal();
        await fetchData();
      }
    } catch (err) {
      console.error('Payment error:', err);
      showToast(err.response?.data?.message || 'Failed to process payment', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCashPaymentSubmit = async () => {
    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/pre-assessments/cash-payment`, {
        bookingReference: selectedItem.bookingReference
      }, { headers: { Authorization: `Bearer ${token}` } });
      setSuccessMessage('Cash Payment Selected!');
      setSuccessDetails({
        title: 'Cash Payment Option',
        message: 'Please visit our office to complete your payment.',
        reference: selectedItem.bookingReference
      });
      setShowSuccessModal(true);
      closeModal();
      fetchData();
    } catch (err) {
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
    }
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
        setSuccessMessage('Payment Submitted!');
        setSuccessDetails({
          title: 'Payment Submitted for Verification',
          message: 'Your payment has been submitted and is now pending verification.',
          reference: selectedItem.invoiceNumber
        });
        setShowSuccessModal(true);
        closeFullPaymentModal();
        fetchData();
      } else if (paymentMethod === 'cash') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/solar-invoices/${selectedItem.invoiceId}/pay-cash`, {
          amount: fullAmount
        }, { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } });
        setSuccessMessage('Cash Payment Selected!');
        setSuccessDetails({
          title: 'Cash Payment Option',
          message: 'Please visit our office to complete your payment.',
          reference: selectedItem.invoiceNumber
        });
        setShowSuccessModal(true);
        closeFullPaymentModal();
        fetchData();
      }
    } catch (err) {
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
  };

  const closeSuccessModal = () => {
    setShowSuccessModal(false);
    setSuccessMessage('');
    setSuccessDetails(null);
  };

  const getStatusBadge = (status) => {
    const badges = {
      'pending': <span className="status-badge-cuspro pending-cuspro">Pending</span>,
      'pending_payment': <span className="status-badge-cuspro pending-cuspro">Pending</span>,
      'paid': <span className="status-badge-cuspro paid-cuspro">Paid</span>,
      'for_verification': <span className="status-badge-cuspro for-verification-cuspro">Verifying</span>,
      'processing': <span className="status-badge-cuspro processing-cuspro">Processing</span>,
      'quoted': <span className="status-badge-cuspro quoted-cuspro">Quoted</span>,
      'completed': <span className="status-badge-cuspro completed-cuspro">Completed</span>,
      'cancelled': <span className="status-badge-cuspro cancelled-cuspro">Cancelled</span>,
      'overdue': <span className="status-badge-cuspro overdue-cuspro">Overdue</span>,
      'partial': <span className="status-badge-cuspro partial-cuspro">Partial</span>
    };
    return badges[status] || <span className="status-badge-cuspro">{status}</span>;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency', currency: 'PHP', minimumFractionDigits: 0, maximumFractionDigits: 0
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
    const pendingItems = allItems.filter(i => i.status === 'pending').length;
    const paidItems = allItems.filter(i => i.status === 'paid').length;
    const forVerificationItems = allItems.filter(i => i.status === 'for_verification').length;
    const totalAmount = allItems.reduce((sum, i) => sum + (i.amount || 0), 0);
    const pendingAmount = allItems.filter(i => i.status === 'pending').reduce((sum, i) => sum + (i.amount || 0), 0);

    return { totalItems, pendingItems, paidItems, forVerificationItems, totalAmount, pendingAmount };
  };

  // Manual Bank Transfer UI Component
  const ManualBankTransferSection = () => {
    const selectedBank = companyBanks.find(b => b.id === selectedBankId);

    return (
      <div className="cuspro-manual-bank-transfer-section">
        <div className="cuspro-bank-transfer-info">
          <div className="bank-transfer-icon">
            <FaUniversity size={40} />
          </div>
          <h4>Manual Bank Transfer</h4>
          <p>Transfer the exact amount to any of our bank accounts below.</p>

          <div className="bank-transfer-notice">
            <FaClock style={{ marginRight: '8px' }} />
            <small>
              <strong>Important:</strong> 
              <ul style={{ margin: '5px 0 0 20px', paddingLeft: '0' }}>
                <li>Transfer the <strong>exact amount</strong> shown on your invoice</li>
                <li>Include your <strong>Invoice Number</strong> as the reference</li>
                <li>Upload a clear screenshot or photo of your transaction</li>
                <li>Your payment will be verified within 24-48 hours</li>
              </ul>
            </small>
          </div>

          <div className="invoice-summary-box">
            <div className="summary-row">
              <span>Invoice:</span>
              <strong>{selectedItem?.invoiceNumber || selectedItem?.id}</strong>
            </div>
            <div className="summary-row">
              <span>Amount Due:</span>
              <strong className="amount-due">
                {formatCurrency(selectedItem?.balance || selectedItem?.totalAmount || selectedItem?.amount)}
              </strong>
            </div>
            <div className="summary-row">
              <span>Reference Number:</span>
              <strong>{selectedItem?.invoiceNumber || selectedItem?.id}</strong>
            </div>
          </div>

          <div className="bank-selection-group">
            <label>Select Bank Account</label>
            <div className="bank-grid">
              {companyBanks.map((bank) => (
                <div
                  key={bank.id}
                  className={`bank-card ${selectedBankId === bank.id ? 'selected' : ''}`}
                  onClick={() => setSelectedBankId(bank.id)}
                >
                  <div className="bank-card-header">
                    <span className="bank-name">{bank.name}</span>
                    {selectedBankId === bank.id && <FaCheck className="check-icon" />}
                  </div>
                  <div className="bank-card-details">
                    <div className="detail-item">
                      <span>Account Name:</span>
                      <strong>{bank.accountName}</strong>
                    </div>
                    <div className="detail-item">
                      <span>Account Number:</span>
                      <strong>{bank.accountNumber}</strong>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {selectedBank && (
            <div className="transfer-form">
              <h5>Payment Details</h5>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Account Name (Optional)</label>
                  <input
                    type="text"
                    name="accountName"
                    value={manualTransferForm.accountName}
                    onChange={handleManualTransferInputChange}
                    placeholder="Your full name as shown in transfer"
                  />
                </div>
                <div className="form-group">
                  <label>Reference / Transaction ID *</label>
                  <input
                    type="text"
                    name="transactionReference"
                    value={manualTransferForm.transactionReference}
                    onChange={handleManualTransferInputChange}
                    placeholder="Enter transaction reference number"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Amount Sent *</label>
                  <input
                    type="number"
                    name="amount"
                    value={manualTransferForm.amount}
                    onChange={handleManualTransferInputChange}
                    placeholder="Enter exact amount sent"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Transfer Date *</label>
                  <input
                    type="date"
                    name="transferDate"
                    value={manualTransferForm.transferDate}
                    onChange={handleManualTransferInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Transfer Time *</label>
                  <input
                    type="time"
                    name="transferTime"
                    value={manualTransferForm.transferTime}
                    onChange={handleManualTransferInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Upload Proof of Payment *</label>
                <div className="file-upload-area">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleProofFileChange}
                    required
                  />
                  {proofFile && (
                    <span className="file-name">
                      📎 {proofFile.name} ({(proofFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                  <small>Accepted: JPG, PNG, GIF, PDF (Max 10MB)</small>
                </div>
              </div>

              <div className="form-group">
                <label>Remarks (Optional)</label>
                <textarea
                  name="remarks"
                  value={manualTransferForm.remarks}
                  onChange={handleManualTransferInputChange}
                  placeholder="Additional notes for the admin"
                  rows="2"
                />
              </div>

              <button
                className="cuspro-submit-transfer-btn"
                onClick={handleSubmitManualTransfer}
                disabled={isSubmittingManual}
              >
                {isSubmittingManual ? (
                  <>
                    <FaSpinner className="spinning" /> Submitting...
                  </>
                ) : (
                  'Submit for Verification'
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const SkeletonLoader = () => (
    <div className="cuspro-quotation-container">
      <div className="cuspro-header-card skeleton-card">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="skeleton-stats">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
      </div>
      <div className="skeleton-filter-bar"></div>
      <div className="skeleton-card-list">
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
        <div className="skeleton-card"></div>
      </div>
    </div>
  );

  const stats = getStatistics();
  const filteredItems = getFilteredItems();

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

      <div className="cuspro-quotation-container">
        {/* Header Section */}
        <div className="cuspro-header-card">
          <div className="cuspro-header-content">
            <h1>My Solar Journey</h1>
            <p>Track your projects, view quotes, and manage payments</p>
            {user && <p className="cuspro-welcome">Welcome back, {getFullName()}!</p>}
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="cuspro-stats-grid">
          <div className="stat-card">
            <div className="stat-icon"><FaReceipt /></div>
            <div className="stat-info">
              <h3>{stats.totalItems}</h3>
              <p>Total Transactions</p>
            </div>
          </div>
          <div className="stat-card pending-stat">
            <div className="stat-icon"><FaClock /></div>
            <div className="stat-info">
              <h3>{stats.pendingItems}</h3>
              <p>Pending Payments</p>
              <small>{formatCurrency(stats.pendingAmount)}</small>
            </div>
          </div>
          <div className="stat-card paid-stat">
            <div className="stat-icon"><FaCheckCircle /></div>
            <div className="stat-info">
              <h3>{stats.paidItems}</h3>
              <p>Completed</p>
            </div>
          </div>
          <div className="stat-card verification-stat">
            <div className="stat-icon"><FaSyncAlt /></div>
            <div className="stat-info">
              <h3>{stats.forVerificationItems}</h3>
              <p>Under Review</p>
            </div>
          </div>
        </div>

        {/* Filter Section */}
        <div className="cuspro-filter-section">
          <div className="cuspro-filter-group">
            <label><FaFilter /> Type</label>
            <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="cuspro-filter-select">
              <option value="all">All Types</option>
              <option value="pre-assessment">Pre-Assessments</option>
              <option value="project">Project Bills</option>
            </select>
          </div>

          <div className="cuspro-filter-group">
            <label><FaWallet /> Status</label>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="cuspro-filter-select">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="paid">Paid</option>
              <option value="for_verification">For Verification</option>
              <option value="partial">Partial</option>
              <option value="overdue">Overdue</option>
            </select>
          </div>

          <div className="cuspro-search-group">
            <label><FaSearch /> Search</label>
            <div className="search-input-wrapper">
              <FaSearch className="search-icon" />
              <input
                type="text"
                placeholder="Search by reference, invoice, or project..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="cuspro-search-input"
              />
              {searchTerm && (
                <button className="clear-search" onClick={() => setSearchTerm('')}>×</button>
              )}
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="cuspro-results-count">
          <p>Showing {filteredItems.length} of {allItems.length} transaction(s)</p>
          {(typeFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
            <button className="clear-filters-btn" onClick={() => {
              setTypeFilter('all');
              setStatusFilter('all');
              setSearchTerm('');
            }}>
              Clear All Filters
            </button>
          )}
        </div>

        {/* Items List - Redesigned Cards */}
        <div className="cuspro-items-list">
          {filteredItems.length === 0 ? (
            <div className="cuspro-empty-state">
              <FaCalendarAlt className="cuspro-empty-icon" />
              <h3>No transactions found</h3>
              <p>Try adjusting your filters or search criteria.</p>
              {(typeFilter !== 'all' || statusFilter !== 'all' || searchTerm) && (
                <button className="cuspro-primary-btn" onClick={() => {
                  setTypeFilter('all');
                  setStatusFilter('all');
                  setSearchTerm('');
                }}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            filteredItems.map((item, index) => {
              const isPreAssessment = item.type === 'pre-assessment';
              const hasQuotation = isPreAssessment && item.quotationUrl;
              const projectExists = isPreAssessment && projects.some(project => {
                if (project.preAssessmentId) {
                  const projectPreAssessmentId = typeof project.preAssessmentId === 'object' ?
                    project.preAssessmentId._id?.toString() : project.preAssessmentId?.toString();
                  const assessmentId = item.assessmentId?.toString();
                  return projectPreAssessmentId === assessmentId;
                }
                return false;
              });
              const alreadyProjectCreated = isPreAssessment && (item.assessmentStatus === 'quotation_accepted' || projectExists);
              const hasReceipt = item.receiptUrl;

              const isPayNowButtonDisabled = isPayNowDisabled(item);
              const disabledReason = getPayNowDisabledReason(item);
              const invoiceLabel = !isPreAssessment ? getInvoiceTypeLabel(item) : null;

              return (
                <div key={index} className={`cuspro-item-card ${item.type}`}>
                  <div className="cuspro-item-header">
                    <div className="cuspro-item-type-badge">
                      {item.icon}
                      <span>{item.typeLabel}</span>
                      {!isPreAssessment && item.invoiceType && invoiceLabel && (
                        <span className={`invoice-type-label ${item.invoiceType}`}>
                          {invoiceLabel}
                        </span>
                      )}
                    </div>
                    {getStatusBadge(item.status)}
                  </div>

                  <div className="cuspro-item-body">
                    <div className="cuspro-item-info">
                      <h3>{item.description}</h3>
                      <p className="cuspro-item-ref">
                        {isPreAssessment ? `Reference: ${item.bookingReference || item.id}` : `Invoice: ${item.id}`}
                      </p>
                      {item.projectName && <p className="cuspro-item-project">{item.projectName}</p>}
                      {isPreAssessment && item.propertyType && (
                        <p className="cuspro-item-property">Property: {item.propertyType}</p>
                      )}
                    </div>

                    <div className="cuspro-item-details">
                      <div className="cuspro-item-detail">
                        <span>Date:</span>
                        <strong>{item.date}</strong>
                      </div>
                      <div className="cuspro-item-detail">
                        <span>Due Date:</span>
                        <strong>{item.dueDate}</strong>
                      </div>
                      <div className="cuspro-item-detail amount">
                        <span>Amount:</span>
                        <strong>{formatCurrency(item.amount)}</strong>
                      </div>
                      {item.paymentStatus === 'partial' && (
                        <>
                          <div className="cuspro-item-detail">
                            <span>Paid:</span>
                            <strong>{formatCurrency(item.amountPaid)}</strong>
                          </div>
                          <div className="cuspro-item-detail">
                            <span>Balance:</span>
                            <strong>{formatCurrency(item.balance)}</strong>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="cuspro-item-actions">
                    {(item.status === 'pending' || item.status === 'partial') && (
                      <button
                        className={`cuspro-pay-btn ${isPayNowButtonDisabled ? 'disabled' : ''}`}
                        onClick={() => handlePayNowClick(item)}
                        disabled={isSubmitting || isPayNowButtonDisabled}
                        title={disabledReason || ''}
                      >
                        <FaMoneyBillWave /> {isSubmitting ? 'Processing...' : 'Pay Now'}
                      </button>
                    )}

                    {isPayNowButtonDisabled && (item.status === 'pending' || item.status === 'partial') && (
                      <span className="payment-prerequisite-message">
                        <FaClock /> {disabledReason}
                      </span>
                    )}

                    {item.status === 'for_verification' && (
                      <span className="cuspro-verification-badge">
                        <FaClock /> Payment Under Review
                      </span>
                    )}

                    {item.status === 'paid' && hasReceipt && (
                      <>
                        <button
                          className="cuspro-receipt-btn"
                          onClick={() => handleViewReceipt(item)}
                        >
                          <FaReceipt /> View Receipt
                        </button>
                        <button
                          className="cuspro-download-receipt-btn"
                          onClick={() => handleDownloadReceipt(item)}
                        >
                          <FaDownload /> Receipt
                        </button>
                      </>
                    )}

                    {item.status === 'paid' && isPreAssessment && (
                      <span className="cuspro-paid-badge">
                        <FaCheckCircle /> Payment Completed
                      </span>
                    )}

                    {item.status === 'paid' && !isPreAssessment && hasReceipt && (
                      <span className="cuspro-paid-badge">
                        <FaCheckCircle /> Payment Completed
                      </span>
                    )}

                    <button
                      className="cuspro-secondary-btn"
                      onClick={() => handleViewDetails(item)}
                    >
                      <FaEye /> Details
                    </button>
                  </div>

                  {isPreAssessment && item.status === 'pending' && (
                    <div className="cuspro-walkin-note">
                      <small>For walk-in payment, please visit our office at Purok 2, Masaya, San Jose, Camarines Sur</small>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modals - Full Payment, Payment, Details, Success */}
        {/* Keep all modals as they are but with updated CSS */}
        
        {/* FULL PAYMENT MODAL */}
        {showFullPaymentModal && selectedItem && (
          <div className="cuspro-modal-overlay" onClick={closeFullPaymentModal}>
            <div className="cuspro-modal cuspro-payment-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={closeFullPaymentModal}><FaTimes /></button>
              <h3>Pay Invoice</h3>
              <div className="cuspro-payment-summary">
                <p><strong>Invoice:</strong> {selectedItem.invoiceNumber}</p>
                <p><strong>Project:</strong> {selectedItem.projectName}</p>
                <p><strong>Amount Due:</strong> {formatCurrency(selectedItem.balance || selectedItem.totalAmount)}</p>
              </div>
              
              <div className="cuspro-payment-methods">
                <h4>Payment Method</h4>
                <div className="cuspro-method-options">
                  <div className={`cuspro-method-option ${paymentMethod === 'gcash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('gcash')}>
                    <input type="radio" checked={paymentMethod === 'gcash'} readOnly />
                    <div><strong>GCash</strong><small>Upload receipt</small></div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'paymongo_card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('paymongo_card')}>
                    <input type="radio" checked={paymentMethod === 'paymongo_card'} readOnly />
                    <div><strong>Credit/Debit Card</strong><small>Instant payment</small></div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'manual_bank_transfer' ? 'selected' : ''}`} onClick={() => setPaymentMethod('manual_bank_transfer')}>
                    <input type="radio" checked={paymentMethod === 'manual_bank_transfer'} readOnly />
                    <div><strong><FaUniversity /> Bank Transfer</strong><small>Manual transfer with proof</small></div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                    <input type="radio" checked={paymentMethod === 'cash'} readOnly />
                    <div><strong>Cash</strong><small>Pay at office</small></div>
                  </div>
                </div>
              </div>

              {/* GCash Payment */}
              {paymentMethod === 'gcash' && (
                <div className="cuspro-payment-form">
                  <div className="cuspro-gcash-details">
                    <h4>GCash Details</h4>
                    <p>Number: <strong>0917XXXXXXX</strong></p>
                    <p>Name: <strong>SALFER ENGINEERING CORP</strong></p>
                  </div>
                  <div className="cuspro-form-group">
                    <label>Reference Number</label>
                    <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} placeholder="Enter reference" />
                  </div>
                  <div className="cuspro-form-group">
                    <label>Upload Screenshot</label>
                    <input type="file" accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} />
                  </div>
                  <button className="cuspro-confirm-btn" onClick={handleFullPaymentSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Submit'}
                  </button>
                </div>
              )}

              {/* Card Payment */}
              {paymentMethod === 'paymongo_card' && (
                <div className="cuspro-payment-form">
                  <div className="cuspro-card-form">
                    <div className="cuspro-form-group">
                      <label>Card Number</label>
                      <input type="text" id="full-card-number" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="cuspro-form-row">
                      <div className="cuspro-form-group">
                        <label>Expiry</label>
                        <input type="text" id="full-card-expiry" placeholder="MM/YY" />
                      </div>
                      <div className="cuspro-form-group">
                        <label>CVC</label>
                        <input type="text" id="full-card-cvc" placeholder="123" />
                      </div>
                    </div>
                    <button className="cuspro-paymongo-btn" onClick={handleProjectPayMongoCardPayment} disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(selectedItem.balance || selectedItem.totalAmount)}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Bank Transfer */}
              {paymentMethod === 'manual_bank_transfer' && <ManualBankTransferSection />}

              {/* Cash Payment */}
              {paymentMethod === 'cash' && (
                <div className="cuspro-payment-form">
                  <div className="cuspro-cash-details">
                    <div className="cuspro-info-box">
                      <strong>Office Address</strong>
                      <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                      <p>Mon-Fri, 8AM-5PM</p>
                    </div>
                    <button className="cuspro-confirm-btn" onClick={handleFullPaymentSubmit} disabled={isSubmitting}>
                      Confirm Cash Payment
                    </button>
                  </div>
                </div>
              )}

              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={closeFullPaymentModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENT MODAL */}
        {showPaymentModal && selectedItem && (
          <div className="cuspro-modal-overlay" onClick={closeModal}>
            <div className="cuspro-modal cuspro-payment-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={closeModal}><FaTimes /></button>
              <h3>Make Payment</h3>
              <div className="cuspro-payment-summary">
                <p><strong>Invoice:</strong> {selectedItem.invoiceNumber || selectedItem.id}</p>
                <p><strong>Amount:</strong> {formatCurrency(selectedItem.amount)}</p>
              </div>
              
              <div className="cuspro-payment-methods">
                <h4>Payment Method</h4>
                <div className="cuspro-method-options">
                  <div className={`cuspro-method-option ${paymentMethod === 'gcash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('gcash')}>
                    <input type="radio" checked={paymentMethod === 'gcash'} readOnly />
                    <div><strong>GCash</strong><small>Upload receipt</small></div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'paymongo_card' ? 'selected' : ''}`} onClick={() => setPaymentMethod('paymongo_card')}>
                    <input type="radio" checked={paymentMethod === 'paymongo_card'} readOnly />
                    <div><strong>Card</strong><small>Instant</small></div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'manual_bank_transfer' ? 'selected' : ''}`} onClick={() => setPaymentMethod('manual_bank_transfer')}>
                    <input type="radio" checked={paymentMethod === 'manual_bank_transfer'} readOnly />
                    <div><strong><FaUniversity /> Bank Transfer</strong><small>Manual with proof</small></div>
                  </div>
                  <div className={`cuspro-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                    <input type="radio" checked={paymentMethod === 'cash'} readOnly />
                    <div><strong>Cash</strong><small>Office</small></div>
                  </div>
                </div>
              </div>

              {/* GCash Payment */}
              {paymentMethod === 'gcash' && (
                <div className="cuspro-payment-form">
                  <div className="cuspro-gcash-details">
                    <h4>GCash Details</h4>
                    <p>Number: <strong>0917XXXXXXX</strong></p>
                    <p>Name: <strong>SALFER ENGINEERING CORP</strong></p>
                  </div>
                  <div className="cuspro-form-group">
                    <label>Reference</label>
                    <input type="text" value={paymentReference} onChange={(e) => setPaymentReference(e.target.value)} />
                  </div>
                  <div className="cuspro-form-group">
                    <label>Screenshot</label>
                    <input type="file" accept="image/*" onChange={(e) => setPaymentProof(e.target.files[0])} />
                  </div>
                  <button className="cuspro-confirm-btn" onClick={handlePaymentSubmit} disabled={isSubmitting}>
                    {isSubmitting ? 'Processing...' : 'Submit'}
                  </button>
                </div>
              )}

              {/* Card Payment */}
              {paymentMethod === 'paymongo_card' && (
                <div className="cuspro-payment-form">
                  <div className="cuspro-card-form">
                    <div className="cuspro-form-group">
                      <label>Card Number</label>
                      <input type="text" id="card-number" placeholder="1234 5678 9012 3456" />
                    </div>
                    <div className="cuspro-form-row">
                      <div className="cuspro-form-group">
                        <label>Expiry</label>
                        <input type="text" id="card-expiry" placeholder="MM/YY" />
                      </div>
                      <div className="cuspro-form-group">
                        <label>CVC</label>
                        <input type="text" id="card-cvc" placeholder="123" />
                      </div>
                    </div>
                    <button className="cuspro-paymongo-btn" onClick={handlePayMongoCardPayment} disabled={isSubmitting}>
                      {isSubmitting ? 'Processing...' : `Pay ${formatCurrency(selectedItem.amount)}`}
                    </button>
                  </div>
                </div>
              )}

              {/* Manual Bank Transfer */}
              {paymentMethod === 'manual_bank_transfer' && <ManualBankTransferSection />}

              {/* Cash Payment */}
              {paymentMethod === 'cash' && (
                <div className="cuspro-payment-form">
                  <div className="cuspro-cash-details">
                    <div className="cuspro-info-box">
                      <strong>Office Address</strong>
                      <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                    </div>
                    <button className="cuspro-confirm-btn" onClick={handleCashPaymentSubmit} disabled={isSubmitting}>
                      Confirm
                    </button>
                  </div>
                </div>
              )}

              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={closeModal}>Cancel</button>
              </div>
            </div>
          </div>
        )}

        {/* DETAILS MODAL */}
        {showDetailsModal && detailsItem && (
          <div className="cuspro-modal-overlay" onClick={() => setShowDetailsModal(false)}>
            <div className="cuspro-modal cuspro-details-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={() => setShowDetailsModal(false)}><FaTimes /></button>
              <h3>Transaction Details</h3>
              <div className="cuspro-details-content">
                {detailsItem.bookingReference ? (
                  <>
                    <div className="cuspro-details-section">
                      <h4>Booking Information</h4>
                      <p><strong>Reference:</strong> {detailsItem.bookingReference}</p>
                      <p><strong>Status:</strong> {detailsItem.paymentStatus || detailsItem.status}</p>
                      <p><strong>Amount:</strong> {formatCurrency(detailsItem.amount)}</p>
                      <p><strong>Date:</strong> {detailsItem.date}</p>
                      <p><strong>Due Date:</strong> {detailsItem.dueDate}</p>
                    </div>
                    <div className="cuspro-details-section">
                      <h4>Assessment Details</h4>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType || 'N/A'}</p>
                      <p><strong>Desired Capacity:</strong> {detailsItem.desiredCapacity ? `${detailsItem.desiredCapacity} kW` : 'N/A'}</p>
                      <p><strong>Roof Type:</strong> {detailsItem.roofType || 'N/A'}</p>
                      <p><strong>Address:</strong> {formatAddress(detailsItem.address)}</p>
                    </div>
                    {detailsItem.systemSize && (
                      <div className="cuspro-details-section">
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
                    <div className="cuspro-details-section">
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
                    <div className="cuspro-details-section">
                      <h4>Payment Details</h4>
                      <p><strong>Total:</strong> {formatCurrency(detailsItem.totalAmount || detailsItem.amount)}</p>
                      {detailsItem.amountPaid > 0 && <p><strong>Paid:</strong> {formatCurrency(detailsItem.amountPaid)}</p>}
                      {detailsItem.balance > 0 && <p><strong>Balance:</strong> {formatCurrency(detailsItem.balance)}</p>}
                    </div>
                  </>
                )}
              </div>
              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS MODAL */}
        {showSuccessModal && (
          <div className="cuspro-modal-overlay" onClick={closeSuccessModal}>
            <div className="cuspro-modal cuspro-success-modal" onClick={e => e.stopPropagation()}>
              <div className="cuspro-success-icon"><FaCheckCircle /></div>
              <h3>{successMessage}</h3>
              <div className="cuspro-success-content">
                <p><strong>{successDetails?.title}</strong></p>
                <p>{successDetails?.message}</p>
                {successDetails?.reference && <p className="cuspro-success-ref">Reference: {successDetails.reference}</p>}
              </div>
              <button className="cuspro-success-btn" onClick={closeSuccessModal}>Close</button>
            </div>
          </div>
        )}

        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
      </div>
    </>
  );
};

export default Quotation;