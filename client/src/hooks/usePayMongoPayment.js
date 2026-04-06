import { useState } from 'react';
import axios from 'axios';

export const usePayMongoPayment = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const createPaymentIntent = async (type, id, paymentId, method) => {
    setLoading(true);
    setError(null);
    
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      
      let url = '';
      if (type === 'pre-assessment') {
        url = `${import.meta.env.VITE_API_URL}/api/payments/pre-assessment/${id}/create-intent`;
      } else {
        url = `${import.meta.env.VITE_API_URL}/api/payments/project/${id}/payment/${paymentId}/create-intent`;
      }

      const response = await axios.post(url, 
        { paymentMethod: method },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create payment intent');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const processGCashPayment = async (type, id, paymentId) => {
    const result = await createPaymentIntent(type, id, paymentId, 'gcash');
    
    if (result.type === 'redirect' && result.redirectUrl) {
      sessionStorage.setItem('pendingPaymentIntentId', result.paymentIntentId);
      sessionStorage.setItem('paymentType', type);
      window.location.href = result.redirectUrl;
    }
    
    return result;
  };

  const processCardPayment = async (type, id, paymentId, cardDetails) => {
    const result = await createPaymentIntent(type, id, paymentId, 'card');
    
    if (result.type === 'card' && result.clientSecret) {
      return result;
    }
    
    throw new Error('Failed to initialize card payment');
  };

  const verifyPayment = async (paymentIntentId) => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/verify`,
        { paymentIntentId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify payment');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getPaymentStatus = async (paymentIntentId) => {
    try {
      const token = sessionStorage.getItem('token') || localStorage.getItem('token');
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/payments/status/${paymentIntentId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      return response.data;
    } catch (err) {
      console.error('Failed to get payment status:', err);
      return null;
    }
  };

  return {
    loading,
    error,
    createPaymentIntent,
    processGCashPayment,
    processCardPayment,
    verifyPayment,
    getPaymentStatus
  };
};