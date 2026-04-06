import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { FaTimesCircle, FaArrowLeft, FaRedo, FaCreditCard, FaMoneyBillWave } from 'react-icons/fa';
import { useToast } from '../../assets/toastnotification';

const PaymentCancel = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();

  useEffect(() => {
    // Get payment type from session storage
    const paymentType = sessionStorage.getItem('paymentType');
    const checkoutId = sessionStorage.getItem('pendingCheckoutId');
    
    console.log('Payment cancelled:', { paymentType, checkoutId });
    
    // Show cancellation message
    showToast('Payment was cancelled', 'warning');
    
    // Clear stored data
    sessionStorage.removeItem('pendingCheckoutId');
    sessionStorage.removeItem('pendingSessionId');
    sessionStorage.removeItem('pendingPaymentIntentId');
    sessionStorage.removeItem('paymentType');
  }, [showToast]);

  const handleRetry = () => {
    // Go back to previous page to retry payment
    window.history.back();
  };

  const handleGoToBilling = () => {
    navigate('/app/customer/billing');
  };

  const handleGoToProjects = () => {
    navigate('/app/customer/quotation?tab=projects');
  };

  const handleUseCash = () => {
    navigate('/app/customer/billing');
    showToast('Please visit our office for cash payment', 'info');
  };

  return (
    <div className="payment-cancel-container">
      <div className="payment-cancel-card">
        <FaTimesCircle className="cancel-icon" />
        <h1>Payment Cancelled</h1>
        <p>Your payment was not completed.</p>
        
        <div className="cancel-reasons">
          <h3>Possible Reasons:</h3>
          <ul>
            <li>You closed the payment window before completing</li>
            <li>Insufficient balance in your GCash account</li>
            <li>Payment was declined by your bank</li>
            <li>Network connection issues</li>
          </ul>
        </div>

        <div className="cancel-actions">
          <button className="btn-retry" onClick={handleRetry}>
            <FaRedo /> Try Again
          </button>
          <button className="btn-cash" onClick={handleUseCash}>
            <FaMoneyBillWave /> Use Cash Instead
          </button>
          <button className="btn-back" onClick={handleGoToBilling}>
            <FaArrowLeft /> Back to Billing
          </button>
        </div>

        <div className="help-section">
          <h4>Need Assistance?</h4>
          <p>Contact our support team:</p>
          <p><strong>Email:</strong> support@salferengineering.com</p>
          <p><strong>Phone:</strong> (123) 456-7890</p>
          <p><strong>Office:</strong> Purok 2, Masaya, San Jose, Camarines Sur</p>
        </div>

        <div className="alternative-payment">
          <h4>Alternative Payment Options</h4>
          <button className="btn-alternative" onClick={handleGoToBilling}>
            <FaCreditCard /> Try Different Payment Method
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentCancel;