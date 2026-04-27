// pages/Customer/Quotation.cuspro.jsx
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
  FaBuilding, FaSyncAlt, FaWallet, FaReceipt
} from 'react-icons/fa';

const Quotation = () => {
  const navigate = useNavigate();
  const { toast, showToast, hideToast } = useToast();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showAcceptModal, setShowAcceptModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [successDetails, setSuccessDetails] = useState(null);
  const [showFullPaymentModal, setShowFullPaymentModal] = useState(false);
  const [acceptingItem, setAcceptingItem] = useState(null);
  const [acceptingLoading, setAcceptingLoading] = useState(false);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [detailsItem, setDetailsItem] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentReference, setPaymentReference] = useState('');
  const [selectedPaymentPreference, setSelectedPaymentPreference] = useState('installment');

  // Filter states
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const [freeQuotes, setFreeQuotes] = useState([]);
  const [projects, setProjects] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);
  const [solarInvoices, setSolarInvoices] = useState([]);
  const [allItems, setAllItems] = useState([]);

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

  // Helper function to check if downpayment is completed for a project (50-50 plan)
  const isDownpaymentCompleted = (projectId) => {
    const projectInvoices = allItems.filter(item =>
      item.type === 'project' &&
      item.projectId === projectId
    );
    const downpaymentInvoice = projectInvoices.find(inv => inv.invoiceType === 'downpayment');
    return downpaymentInvoice && downpaymentInvoice.status === 'paid';
  };

  // Helper function to check if initial payment is completed for a project (30-60-10 plan)
  const isInitialPaymentCompleted = (projectId) => {
    const projectInvoices = allItems.filter(item =>
      item.type === 'project' &&
      item.projectId === projectId
    );
    const initialInvoice = projectInvoices.find(inv => inv.invoiceType === 'initial');
    return initialInvoice && initialInvoice.status === 'paid';
  };

  // Helper function to check if progress payment is completed for a project
  const isProgressPaymentCompleted = (projectId) => {
    const projectInvoices = allItems.filter(item =>
      item.type === 'project' &&
      item.projectId === projectId
    );
    const progressInvoice = projectInvoices.find(inv => inv.invoiceType === 'progress');
    return progressInvoice && progressInvoice.status === 'paid';
  };

  // Helper function to check if final payment is completed (for 30-60-10, final is 30%)
  const isFinalPaymentCompleted = (projectId) => {
    const projectInvoices = allItems.filter(item =>
      item.type === 'project' &&
      item.projectId === projectId
    );
    const finalInvoice = projectInvoices.find(inv => inv.invoiceType === 'final');
    return finalInvoice && finalInvoice.status === 'paid';
  };

  // Check if Pay Now button should be disabled for an item
  const isPayNowDisabled = (item) => {
    if (item.type !== 'project') return false;

    const invoiceType = item.invoiceType;
    const projectId = item.projectId;

    // For 50-50 plan: Final payment - disable if Downpayment not paid
    if (invoiceType === 'final') {
      // Check if this is from 50-50 plan or 30-60-10 plan
      const hasDownpayment = allItems.some(inv => inv.projectId === projectId && inv.invoiceType === 'downpayment');
      if (hasDownpayment) {
        // 50-50 plan: final payment requires downpayment
        return !isDownpaymentCompleted(projectId);
      } else {
        // 30-60-10 plan: final payment (30%) requires progress payment
        return !isProgressPaymentCompleted(projectId);
      }
    }

    // For Retention payment (10%) - disable if Final not paid
    if (invoiceType === 'retention') {
      return !isFinalPaymentCompleted(projectId);
    }

    // For Progress payment - disable if Initial not paid (30-60-10 plan)
    if (invoiceType === 'progress') {
      return !isInitialPaymentCompleted(projectId);
    }

    // Downpayment and Initial are always enabled
    return false;
  };

  // Get disabled reason for tooltip or display
  const getPayNowDisabledReason = (item) => {
    if (item.type !== 'project') return null;

    const invoiceType = item.invoiceType;
    const projectId = item.projectId;

    if (invoiceType === 'progress') {
      return 'Initial payment (30%) must be completed first';
    }

    if (invoiceType === 'final') {
      const hasDownpayment = allItems.some(inv => inv.projectId === projectId && inv.invoiceType === 'downpayment');
      if (hasDownpayment) {
        return 'Downpayment (50%) must be completed first';
      } else {
        return 'Progress payment (60%) must be completed first';
      }
    }

    if (invoiceType === 'retention') {
      return 'Final payment (30%) must be completed first. Retention fee is released after project completion and warranty period.';
    }

    return null;
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
    // Check if payment is allowed before proceeding
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
    // Check if payment is allowed for project items
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

  const handleAcceptQuotationClick = (assessment) => {
    setAcceptingItem(assessment);
    setSelectedPaymentPreference('installment');
    setShowAcceptModal(true);
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

  const confirmAcceptQuotation = async () => {
    if (!acceptingItem) return;
    setAcceptingLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/projects/accept`,
        {
          sourceType: 'pre-assessment',
          sourceId: acceptingItem.assessmentId,
          paymentPreference: selectedPaymentPreference
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccessMessage('Quotation Accepted!');
      setSuccessDetails({
        title: 'Quotation Accepted Successfully',
        message: `Your quotation has been accepted. ${selectedPaymentPreference === 'full' ? 'You can now proceed with full payment.' : selectedPaymentPreference === 'thirty_sixty_ten' ? 'Invoices will be generated: 30% Downpayment, 60% Progress, 10% Retention (released after warranty).' : selectedPaymentPreference === 'fifty_fifty' ? 'Invoices will be generated: 50% Downpayment, 50% Final.' : 'Invoices will be generated for each payment milestone.'}`,
        reference: response.data.project?.projectReference
      });
      setShowSuccessModal(true);
      setShowAcceptModal(false);
      setAcceptingItem(null);
      fetchData();
    } catch (err) {
      console.error('Error accepting quotation:', err);
      showToast(err.response?.data?.message || 'Failed to accept quotation. Please try again.', 'error');
    } finally {
      setAcceptingLoading(false);
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
  };

  const closeFullPaymentModal = () => {
    setShowFullPaymentModal(false);
    setSelectedItem(null);
    setPaymentProof(null);
    setPaymentReference('');
    setPaymentMethod(null);
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

  const SkeletonLoader = () => (
    <div className="cuspro-quotation-container">
      <div className="cuspro-header-card skeleton-card">
        <div className="skeleton-line large"></div>
        <div className="skeleton-line medium"></div>
      </div>
      <div className="skeleton-filter-bar"></div>
      <div className="skeleton-stats"></div>
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
        <div className="cuspro-header-card">
          <div className="cuspro-header-content">
            <h1>My Solar Journey</h1>
            <p>Track your projects, view quotes, and manage payments</p>
            {user && <p className="cuspro-welcome">Welcome, {getFullName()}!</p>}
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

        {/* Items List */}
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

              // Check if Pay Now button should be disabled
              const isPayNowButtonDisabled = isPayNowDisabled(item);
              const disabledReason = getPayNowDisabledReason(item);

              return (
                <div key={index} className={`cuspro-item-card ${item.type}`}>
                  <div className="cuspro-item-header">
                    <div className="cuspro-item-type-badge">
                      {item.icon}
                      <span>{item.typeLabel}</span>
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
                      {!isPreAssessment && item.invoiceType && (
                        <span className={`invoice-type-label ${item.invoiceType}`}>
                          {item.invoiceType === 'downpayment' && 'Downpayment (50%)'}
                          {item.invoiceType === 'initial' && 'Initial (30%)'}
                          {item.invoiceType === 'progress' && 'Progress (40% or 60%)'}
                          {item.invoiceType === 'final' && 'Final Payment (30%)'}
                          {item.invoiceType === 'retention' && 'Retention Fee (10%)'}
                          {item.invoiceType === 'full' && 'Full Payment'}
                        </span>
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
                    {/* Pay Now button with conditional disabling */}
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

                    {/* Show prerequisite message for disabled buttons */}
                    {isPayNowButtonDisabled && (item.status === 'pending' || item.status === 'partial') && (
                      <span className="payment-prerequisite-message">
                        ⚠️ {disabledReason}
                      </span>
                    )}

                    {/* Verification badge */}
                    {item.status === 'for_verification' && (
                      <span className="cuspro-verification-badge">
                        <FaClock /> Payment Under Review
                      </span>
                    )}

                    {/* RECEIPT BUTTON - For paid transactions */}
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

                    {/* Paid badge for pre-assessment without receipt yet */}
                    {item.status === 'paid' && isPreAssessment && hasReceipt && (
                      <>
                        {hasQuotation && !alreadyProjectCreated && (
                          <>
                            <button
                              className="cuspro-secondary-btn"
                              onClick={() => handleViewQuotation(item)}
                            >
                              <FaEye /> View Quote
                            </button>
                            <button
                              className="cuspro-secondary-btn"
                              onClick={() => handleDownloadQuotation(item)}
                              disabled={pdfLoading}
                            >
                              <FaDownload /> {pdfLoading ? '...' : 'Download'}
                            </button>
                            <button
                              className="cuspro-accept-btn"
                              onClick={() => handleAcceptQuotationClick(item)}
                            >
                              <FaCheckCircle /> Accept Quote
                            </button>
                          </>
                        )}
                        {alreadyProjectCreated && (
                          <button
                            className="cuspro-view-project-btn"
                            onClick={() => navigate('/app/customer/project')}
                          >
                            <FaProjectDiagram /> View Project
                          </button>
                        )}
                      </>
                    )}

                    {/* Project paid badge */}
                    {item.status === 'paid' && !isPreAssessment && hasReceipt && (
                      <span className="cuspro-paid-badge">
                        <FaCheckCircle /> Payment Completed
                      </span>
                    )}

                    {/* Details button */}
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

        {/* ACCEPT QUOTATION MODAL */}
        {showAcceptModal && acceptingItem && (
          <div className="cuspro-modal-overlay" onClick={() => setShowAcceptModal(false)}>
            <div className="cuspro-modal cuspro-accept-modal" onClick={e => e.stopPropagation()}>
              <button className="cuspro-modal-close" onClick={() => setShowAcceptModal(false)}><FaTimes /></button>
              <h3>Accept Quotation</h3>
              <p>Please select your payment preference</p>
              <div className="cuspro-quotation-summary">
                <h4>Summary</h4>
                <div className="cuspro-summary-row">
                  <span>System Size:</span>
                  <strong>{acceptingItem.systemSize || 'TBD'} kWp</strong>
                </div>
                <div className="cuspro-summary-row">
                  <span>Total Cost:</span>
                  <strong>{formatCurrency(acceptingItem.totalCost || acceptingItem.amount)}</strong>
                </div>
              </div>
              <div className="cuspro-payment-preference-section">
                <h4>Payment Option</h4>

                {/* Option 1: 50% - 50% Installment */}
                <div
                  className={`cuspro-preference-option ${selectedPaymentPreference === 'fifty_fifty' ? 'selected' : ''}`}
                  onClick={() => setSelectedPaymentPreference('fifty_fifty')}
                >
                  <input type="radio" checked={selectedPaymentPreference === 'fifty_fifty'} readOnly />
                  <div className="cuspro-preference-content">
                    <strong>50% - 50% Installment</strong>
                    <div className="cuspre-preference-details">
                      <span>Downpayment (50%): {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.5)}</span>
                      <span>Final Payment (50%): {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.5)}</span>
                    </div>
                  </div>
                </div>

                {/* Option 2: 30% - 60% - 10% (with 10% Retention) */}
                <div
                  className={`cuspro-preference-option ${selectedPaymentPreference === 'thirty_sixty_ten' ? 'selected' : ''}`}
                  onClick={() => setSelectedPaymentPreference('thirty_sixty_ten')}
                >
                  <input type="radio" checked={selectedPaymentPreference === 'thirty_sixty_ten'} readOnly />
                  <div className="cuspro-preference-content">
                    <strong>Installment with Retention (30% - 60% - 10%)</strong>
                    <div className="cuspre-preference-details">
                      <span>Downpayment (30%): {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.3)}</span>
                      <span>Progress Payment (60%): {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.6)}</span>
                      <span className="retention-note">Retention Fee (10%): {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.1)}</span>
                  
                    </div>
                  </div>
                </div>

                {/* Option 3: 30% - 40% - 30% Installment */}
                <div
                  className={`cuspro-preference-option ${selectedPaymentPreference === 'installment' ? 'selected' : ''}`}
                  onClick={() => setSelectedPaymentPreference('installment')}
                >
                  <input type="radio" checked={selectedPaymentPreference === 'installment'} readOnly />
                  <div className="cuspro-preference-content">
                    <strong>Installment (30% - 40% - 30%)</strong>
                    <div className="cuspre-preference-details">
                      <span>Initial (30%): {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.3)}</span>
                      <span>Progress (40%): {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.4)}</span>
                      <span>Final (30%): {formatCurrency((acceptingItem.totalCost || acceptingItem.amount) * 0.3)}</span>
                    </div>
                  </div>
                </div>

                {/* Option 4: Full Payment */}
                <div
                  className={`cuspro-preference-option ${selectedPaymentPreference === 'full' ? 'selected' : ''}`}
                  onClick={() => setSelectedPaymentPreference('full')}
                >
                  <input type="radio" checked={selectedPaymentPreference === 'full'} readOnly />
                  <div className="cuspro-preference-content">
                    <strong>Full Payment</strong>
                    <div className="cuspre-preference-details full-payment-details">
                      <span>Amount: {formatCurrency(acceptingItem.totalCost || acceptingItem.amount)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="cuspro-modal-actions">
                <button className="cuspro-cancel-btn" onClick={() => setShowAcceptModal(false)}>Cancel</button>
                <button className="cuspro-confirm-btn" onClick={confirmAcceptQuotation} disabled={acceptingLoading}>
                  {acceptingLoading ? <FaSpinner className="spinning" /> : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL PAYMENT MODAL */}
        {showFullPaymentModal && selectedItem && (
          <div className="cuspro-modal-overlay" onClick={closeFullPaymentModal}>
            <div className="cuspro-modal" onClick={e => e.stopPropagation()}>
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
                  <div className={`cuspro-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                    <input type="radio" checked={paymentMethod === 'cash'} readOnly />
                    <div><strong>Cash</strong><small>Pay at office</small></div>
                  </div>
                </div>
              </div>
              {paymentMethod === 'gcash' && (
                <>
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
                </>
              )}
              {paymentMethod === 'paymongo_card' && (
                <div className="cuspro-paymongo-section">
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
              {paymentMethod === 'cash' && (
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
            <div className="cuspro-modal" onClick={e => e.stopPropagation()}>
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
                  <div className={`cuspro-method-option ${paymentMethod === 'cash' ? 'selected' : ''}`} onClick={() => setPaymentMethod('cash')}>
                    <input type="radio" checked={paymentMethod === 'cash'} readOnly />
                    <div><strong>Cash</strong><small>Office</small></div>
                  </div>
                </div>
              </div>
              {paymentMethod === 'gcash' && (
                <>
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
                </>
              )}
              {paymentMethod === 'paymongo_card' && (
                <div className="cuspro-paymongo-section">
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
              {paymentMethod === 'cash' && (
                <div className="cuspro-cash-details">
                  <div className="cuspro-info-box">
                    <strong>Office Address</strong>
                    <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                  </div>
                  <button className="cuspro-confirm-btn" onClick={handleCashPaymentSubmit} disabled={isSubmitting}>
                    Confirm
                  </button>
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
                      {detailsItem.receiptUrl && (
                        <p><strong>Receipt:</strong> <a href={detailsItem.receiptUrl} target="_blank" rel="noopener noreferrer">View Receipt</a></p>
                      )}
                    </div>
                    <div className="cuspro-details-section">
                      <h4>Assessment Details</h4>
                      <p><strong>Property Type:</strong> {detailsItem.propertyType || 'N/A'}</p>
                      <p><strong>Desired Capacity:</strong> {detailsItem.desiredCapacity ? `${detailsItem.desiredCapacity} kW` : 'N/A'}</p>
                      <p><strong>Roof Type:</strong> {detailsItem.roofType || 'N/A'}</p>
                      <p><strong>Preferred Date:</strong> {detailsItem.preferredDate ? new Date(detailsItem.preferredDate).toLocaleDateString() : 'N/A'}</p>
                      <p><strong>Address:</strong> {formatAddress(detailsItem.address)}</p>
                    </div>
                    {detailsItem.systemSize && (
                      <div className="cuspro-details-section">
                        <h4>Quotation Details</h4>
                        <p><strong>System Size:</strong> {detailsItem.systemSize} kWp</p>
                        <p><strong>System Type:</strong> {detailsItem.systemType || 'N/A'}</p>
                        <p><strong>Panels Needed:</strong> {detailsItem.panelsNeeded || 'N/A'}</p>
                        <p><strong>Inverter Type:</strong> {detailsItem.inverterType || 'N/A'}</p>
                        <p><strong>Battery Type:</strong> {detailsItem.batteryType || 'N/A'}</p>
                        <p><strong>Total Cost:</strong> {formatCurrency(detailsItem.totalCost)}</p>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <div className="cuspro-details-section">
                      <h4>Bill Information</h4>
                      <p><strong>Invoice Number:</strong> {detailsItem.id}</p>
                      <p><strong>Invoice ID:</strong> {detailsItem.invoiceNumber}</p>
                      <p><strong>Project:</strong> {detailsItem.projectName || 'N/A'}</p>
                      <p><strong>Project Reference:</strong> {detailsItem.projectReference || 'N/A'}</p>
                      <p><strong>Status:</strong> {detailsItem.status}</p>
                      <p><strong>Date:</strong> {detailsItem.date}</p>
                      <p><strong>Due Date:</strong> {detailsItem.dueDate}</p>
                      {detailsItem.receiptUrl && (
                        <p><strong>Receipt:</strong> <a href={detailsItem.receiptUrl} target="_blank" rel="noopener noreferrer">View Receipt</a></p>
                      )}
                      {detailsItem.invoiceType && (
                        <p><strong>Invoice Type:</strong> {
                          detailsItem.invoiceType === 'downpayment' ? 'Downpayment (50%)' :
                            detailsItem.invoiceType === 'initial' ? 'Initial (30%)' :
                              detailsItem.invoiceType === 'progress' ? 'Progress (40% or 60%)' :
                                detailsItem.invoiceType === 'final' ? 'Final Payment (30%)' :
                                  detailsItem.invoiceType === 'retention' ? 'Retention Fee (10%)' :
                                    detailsItem.invoiceType === 'full' ? 'Full Payment' : detailsItem.invoiceType
                        }</p>
                      )}
                    </div>
                    <div className="cuspro-details-section">
                      <h4>Payment Details</h4>
                      <p><strong>Total Amount:</strong> {formatCurrency(detailsItem.totalAmount || detailsItem.amount)}</p>
                      {detailsItem.amountPaid > 0 && <p><strong>Amount Paid:</strong> {formatCurrency(detailsItem.amountPaid)}</p>}
                      {detailsItem.balance > 0 && <p><strong>Balance:</strong> {formatCurrency(detailsItem.balance)}</p>}
                      {detailsItem.paymentStatus === 'partial' && (
                        <p><strong>Payment Status:</strong> Partial Payment</p>
                      )}
                      {detailsItem.paymentStatus === 'paid' && (
                        <p><strong>Payment Status:</strong> Fully Paid</p>
                      )}
                      {detailsItem.paymentStatus === 'pending' && (
                        <p><strong>Payment Status:</strong> Pending</p>
                      )}
                      {detailsItem.paymentStatus === 'for_verification' && (
                        <p><strong>Payment Status:</strong> Under Verification</p>
                      )}
                    </div>
                    {detailsItem.payments && detailsItem.payments.length > 0 && (
                      <div className="cuspro-details-section">
                        <h4>Payment History</h4>
                        {detailsItem.payments.map((payment, idx) => (
                          <div key={idx} className="payment-history-item">
                            <p><strong>Date:</strong> {new Date(payment.paymentDate).toLocaleDateString()}</p>
                            <p><strong>Amount:</strong> {formatCurrency(payment.amount)}</p>
                            <p><strong>Method:</strong> {payment.paymentMethod}</p>
                            {payment.referenceNumber && <p><strong>Reference:</strong> {payment.referenceNumber}</p>}
                            {idx < detailsItem.payments.length - 1 && <hr />}
                          </div>
                        ))}
                      </div>
                    )}
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