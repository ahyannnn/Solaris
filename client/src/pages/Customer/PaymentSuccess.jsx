import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { FaCheckCircle, FaSpinner } from 'react-icons/fa';
import { useToast } from '../../assets/toastnotification';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const [verifying, setVerifying] = useState(true);
  const [paymentData, setPaymentData] = useState(null);
  const hasVerified = useRef(false);

  useEffect(() => {
    // In PaymentSuccess.jsx - update the verification
    const verifyPayment = async () => {
      const urlParams = new URLSearchParams(location.search);

      // Get payment_intent_id from URL (PayMongo redirects with this)
      let paymentIntentId = urlParams.get('payment_intent_id');

      // Also check stored value
      const storedPaymentIntentId = sessionStorage.getItem('pendingPaymentIntentId');
      const finalPaymentIntentId = paymentIntentId || storedPaymentIntentId;

      console.log('Verifying payment with intent ID:', finalPaymentIntentId);

      if (!finalPaymentIntentId) {
        showToast('No payment session found', 'error');
        navigate('/app/customer/billing');
        return;
      }

      try {
        const token = sessionStorage.getItem('token') || localStorage.getItem('token');

        // Call the verify endpoint with the payment_intent_id
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/payments/verify/${finalPaymentIntentId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setPaymentData(response.data);
          showToast('Payment successful!', 'success');
          // Clear stored data
          sessionStorage.removeItem('pendingPaymentIntentId');
          sessionStorage.removeItem('paymentType');
        } else {
          showToast(response.data.message || 'Payment verification failed', 'error');
        }
      } catch (error) {
        console.error('Verification error:', error);
        showToast(error.response?.data?.message || 'Failed to verify payment', 'error');
      } finally {
        setVerifying(false);
      }
    };

    verifyPayment();
  }, [location, navigate, showToast]);

  const handleGoToBilling = () => {
    navigate('/app/customer/billing');
  };

  const handleGoToProjects = () => {
    navigate('/app/customer/quotation?tab=projects');
  };

  if (verifying) {
    return (
      <div className="payment-success-container">
        <div className="payment-verifying">
          <FaSpinner className="spinning large" />
          <h2>Verifying Your Payment...</h2>
          <p>Please wait while we confirm your transaction.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-success-container">
      <div className="payment-success-card">
        <FaCheckCircle className="success-icon" />
        <h1>Payment Successful!</h1>

        {paymentData?.type === 'pre_assessment' && (
          <>
            <p>Your pre-assessment has been confirmed.</p>
            <div className="payment-details">
              <p><strong>Booking Reference:</strong> {paymentData.data?.bookingReference}</p>
              <p><strong>Invoice Number:</strong> {paymentData.data?.invoiceNumber}</p>
              <p><strong>Amount Paid:</strong> ₱1,500</p>
            </div>
            <div className="next-steps">
              <h3>What's Next?</h3>
              <ul>
                <li>Our team will schedule your site assessment</li>
                <li>You will receive a confirmation email</li>
                <li>An engineer will contact you within 24 hours</li>
              </ul>
            </div>
            <div className="success-actions">
              <button className="btn-dashboard" onClick={handleGoToBilling}>
                Go to My Billing
              </button>
              <button className="btn-secondary" onClick={handleGoToProjects}>
                View My Projects
              </button>
            </div>
          </>
        )}

        {paymentData?.type === 'project_payment' && (
          <>
            <p>Your payment has been recorded successfully.</p>
            <div className="payment-details">
              <p><strong>Project Reference:</strong> {paymentData.data?.projectReference}</p>
              <p><strong>Amount Paid:</strong> ₱{paymentData.data?.amountPaid?.toLocaleString()}</p>
              <p><strong>Remaining Balance:</strong> ₱{paymentData.data?.balance?.toLocaleString()}</p>
              <p><strong>Project Status:</strong> {paymentData.data?.status}</p>
            </div>
            <div className="success-actions">
              <button className="btn-dashboard" onClick={handleGoToProjects}>
                View My Projects
              </button>
              <button className="btn-secondary" onClick={handleGoToBilling}>
                Go to Billing
              </button>
            </div>
          </>
        )}

        {!paymentData && (
          <>
            <p>Your payment has been processed successfully.</p>
            <div className="payment-details">
              <p><strong>Status:</strong> Completed</p>
            </div>
            <button className="btn-dashboard" onClick={handleGoToBilling}>
              Return to Dashboard
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;