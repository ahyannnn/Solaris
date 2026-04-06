import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

const getAuthHeader = () => {
  const token = sessionStorage.getItem('token') || localStorage.getItem('token');
  return { Authorization: `Bearer ${token}` };
};

export const paymongoClient = {
  // Pre-assessment payment
  createPreAssessmentPaymentIntent: async (preAssessmentId, paymentMethod) => {
    const response = await axios.post(
      `${API_URL}/api/payments/pre-assessment/${preAssessmentId}/create-intent`,
      { paymentMethod },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Project payment
  createProjectPaymentIntent: async (projectId, paymentId, paymentMethod) => {
    const response = await axios.post(
      `${API_URL}/api/payments/project/${projectId}/payment/${paymentId}/create-intent`,
      { paymentMethod },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Verify payment
  verifyPayment: async (paymentIntentId) => {
    const response = await axios.post(
      `${API_URL}/api/payments/verify`,
      { paymentIntentId },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  // Get payment status
  getPaymentStatus: async (paymentIntentId) => {
    const response = await axios.get(
      `${API_URL}/api/payments/status/${paymentIntentId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};