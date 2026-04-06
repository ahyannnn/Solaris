import React, { useState } from 'react';
import axios from 'axios';
import { FaSpinner, FaQrcode } from 'react-icons/fa';

const GCashPaymentButton = ({ amount, description, type, id, paymentId, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);

  const handleGCashPayment = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      let url = '';
      if (type === 'pre-assessment') {
        url = `${import.meta.env.VITE_API_URL}/api/payments/pre-assessment/${id}/create-intent`;
      } else {
        url = `${import.meta.env.VITE_API_URL}/api/payments/project/${id}/payment/${paymentId}/create-intent`;
      }

      const response = await axios.post(url, 
        { paymentMethod: 'gcash' },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.type === 'redirect' && response.data.redirectUrl) {
        sessionStorage.setItem('pendingPaymentIntentId', response.data.paymentIntentId);
        sessionStorage.setItem('paymentType', type);
        window.location.href = response.data.redirectUrl;
      } else {
        onError?.('Failed to create GCash payment');
      }
    } catch (error) {
      console.error('GCash payment error:', error);
      onError?.(error.response?.data?.message || 'Failed to initialize GCash payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button 
      onClick={handleGCashPayment} 
      className="gcash-pay-button"
      disabled={loading}
    >
      {loading ? (
        <><FaSpinner className="spinning" /> Processing...</>
      ) : (
        <><FaQrcode /> Pay with GCash</>
      )}
    </button>
  );
};

export default GCashPaymentButton;