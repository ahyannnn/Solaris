const axios = require('axios');
const paymongoConfig = require('../config/paymongo');

class PayMongoService {
  constructor() {
    this.secretKey = paymongoConfig.secretKey;
    this.baseURL = paymongoConfig.baseURL;
    this.auth = Buffer.from(`${this.secretKey}:`).toString('base64');
  }

  // Create Payment Intent (works for both card and GCash)
  async createPaymentIntent(amount, description, metadata = {}, paymentMethods = ['card', 'gcash']) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payment_intents`,
        {
          data: {
            attributes: {
              amount: Math.round(amount * 100),
              currency: 'PHP',
              payment_method_allowed: paymentMethods,
              capture_type: 'automatic',
              description: description.substring(0, 100),
              metadata: metadata
            }
          }
        },
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        clientSecret: response.data.data.attributes.client_key,
        paymentIntentId: response.data.data.id,
        amount: response.data.data.attributes.amount / 100,
        status: response.data.data.attributes.status
      };
    } catch (error) {
      console.error('PayMongo create payment intent error:', JSON.stringify(error.response?.data, null, 2));
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || 'Failed to create payment intent'
      };
    }
  }

  // Create Payment Method (for card payments)
  async createCardPaymentMethod(cardDetails, billingDetails = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payment_methods`,
        {
          data: {
            attributes: {
              type: 'card',
              details: {
                card_number: cardDetails.cardNumber,
                exp_month: cardDetails.expMonth,
                exp_year: cardDetails.expYear,
                cvc: cardDetails.cvc
              },
              billing: {
                name: billingDetails.name || 'Customer',
                email: billingDetails.email || 'customer@example.com'
              }
            }
          }
        },
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        paymentMethodId: response.data.data.id
      };
    } catch (error) {
      console.error('PayMongo create card payment method error:', JSON.stringify(error.response?.data, null, 2));
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || 'Failed to create payment method'
      };
    }
  }

  // Attach Payment Method to Intent (for card payments)
  async attachPaymentMethod(paymentIntentId, paymentMethodId, returnUrl) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payment_intents/${paymentIntentId}/attach`,
        {
          data: {
            attributes: {
              payment_method: paymentMethodId,
              return_url: returnUrl
            }
          }
        },
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        status: response.data.data.attributes.status,
        paymentIntent: response.data.data
      };
    } catch (error) {
      console.error('PayMongo attach payment method error:', JSON.stringify(error.response?.data, null, 2));
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || 'Failed to attach payment method'
      };
    }
  }

  // Create GCash Payment Source (for GCash payments)
  async createGCashPaymentSource(paymentIntentId, successUrl, cancelUrl) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payment_intents/${paymentIntentId}/attach_gcash`,
        {
          data: {
            attributes: {
              success_url: successUrl,
              cancel_url: cancelUrl
            }
          }
        },
        {
          headers: {
            'Authorization': `Basic ${this.auth}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        success: true,
        redirectUrl: response.data.data.attributes.redirect?.checkout_url,
        status: response.data.data.attributes.status
      };
    } catch (error) {
      console.error('PayMongo create GCash payment source error:', JSON.stringify(error.response?.data, null, 2));
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || 'Failed to create GCash payment'
      };
    }
  }

  // Get Payment Intent Status (already have this, but ensure it's there)
async getPaymentIntent(paymentIntentId) {
  try {
    const response = await axios.get(
      `${this.baseURL}/payment_intents/${paymentIntentId}`,
      {
        headers: {
          'Authorization': `Basic ${this.auth}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const paymentIntent = response.data.data;
    const status = paymentIntent.attributes.status;
    const payments = paymentIntent.attributes.payments;
    
    // Check if any payment has status 'paid'
    const isPaid = status === 'succeeded' || 
                   (payments && payments.some(p => p.attributes.status === 'paid'));
    
    return {
      success: true,
      status: status,
      isPaid: isPaid,
      amount: paymentIntent.attributes.amount / 100,
      paidAt: paymentIntent.attributes.paid_at,
      paymentMethod: paymentIntent.attributes.payment_method_allowed,
      metadata: paymentIntent.attributes.metadata,
      paymentDetails: payments ? payments[0] : null
    };
  } catch (error) {
    console.error('PayMongo get payment intent error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errors?.[0]?.detail || 'Failed to get payment status'
    };
  }
}
  // Get test card (development only)
  getTestCard() {
    return {
      cardNumber: '4343434343434345',
      expMonth: 12,
      expYear: 2030,
      cvc: '123'
    };
  }
}

module.exports = new PayMongoService();