// services/paymongoService.js
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

  // =============================================
  // ✅ NEW: Create DOB Payment Method (BPI, UnionBank)
  // =============================================
  async createDOBPaymentMethod(bankCode, billingDetails = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payment_methods`,
        {
          data: {
            attributes: {
              type: 'dob',
              details: { bank_code: bankCode }, // 'bpi' or 'ubp'
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
        paymentMethodId: response.data.data.id,
        type: 'dob'
      };
    } catch (error) {
      console.error('PayMongo create DOB payment method error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || 'Failed to create DOB payment method'
      };
    }
  }

  // =============================================
  // ✅ NEW: Create Brankas Payment Method (BDO, Metrobank, Landbank)
  // =============================================
  async createBrankasPaymentMethod(bankCode, billingDetails = {}) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payment_methods`,
        {
          data: {
            attributes: {
              type: 'brankas',
              details: { bank_code: bankCode }, // 'bdo', 'metrobank', 'landbank'
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
        paymentMethodId: response.data.data.id,
        type: 'brankas'
      };
    } catch (error) {
      console.error('PayMongo create Brankas payment method error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || 'Failed to create Brankas payment method'
      };
    }
  }

  // =============================================
  // ✅ NEW: Attach Payment Method with Redirect (for DOB/Brankas)
  // =============================================
  async attachPaymentMethodWithRedirect(paymentIntentId, paymentMethodId, clientKey, returnUrl) {
    try {
      const response = await axios.post(
        `${this.baseURL}/payment_intents/${paymentIntentId}/attach`,
        {
          data: {
            attributes: {
              payment_method: paymentMethodId,
              client_key: clientKey,
              return_url: returnUrl
            }
          }
        },
        {
          headers: {
            Authorization: `Basic ${this.auth}`,
            "Content-Type": "application/json"
          }
        }
      );

      console.log("===== ATTACH RESPONSE =====");
      console.log(JSON.stringify(response.data, null, 2));
      console.log("===========================");

      const paymentIntent = response.data.data;
      const redirectUrl = paymentIntent.attributes?.next_action?.redirect?.url;

      return {
        success: true,
        status: paymentIntent.attributes.status,
        redirectUrl: redirectUrl,
        paymentIntent: paymentIntent
      };
    } catch (error) {
      console.error('PayMongo attach payment method error:', error.response?.data);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || 'Failed to attach payment method'
      };
    }
  }

  // =============================================
  // ✅ NEW: Direct Bank Transfer Flow (Combined)
  // =============================================
  async createBankTransferPayment(amount, description, bankCode, provider, billingDetails = {}) {
    try {
      // Step 1: Create Payment Intent
      const paymentIntent = await this.createPaymentIntent(
        amount,
        description,
        { provider, bankCode },
        [provider] // 'dob' or 'brankas'
      );

      if (!paymentIntent.success) {
        return paymentIntent;
      }

      // Step 2: Create Payment Method
      let paymentMethod;
      if (provider === 'dob') {
        paymentMethod = await this.createDOBPaymentMethod(bankCode, billingDetails);
      } else if (provider === 'brankas') {
        paymentMethod = await this.createBrankasPaymentMethod(bankCode, billingDetails);
      } else {
        return { success: false, error: 'Invalid provider. Use "dob" or "brankas"' };
      }

      if (!paymentMethod.success) {
        return paymentMethod;
      }

      // Step 3: Attach Payment Method
      const attachResult = await this.attachPaymentMethodWithRedirect(
        paymentIntent.paymentIntentId,
        paymentMethod.paymentMethodId,
        paymentIntent.clientSecret,
        `${process.env.FRONTEND_URL}/app/customer/payment-success`
      );

      if (!attachResult.success) {
        return attachResult;
      }

      return {
        success: true,
        paymentIntentId: paymentIntent.paymentIntentId,
        redirectUrl: attachResult.redirectUrl,
        status: attachResult.status,
        provider: provider,
        bankCode: bankCode
      };

    } catch (error) {
      console.error('Bank transfer payment error:', error);
      return {
        success: false,
        error: error.message || 'Failed to create bank transfer payment'
      };
    }
  }

  // Create Card Payment Method
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

  // Create GCash Payment Source
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

  // Get Payment Intent Status
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
        paymentDetails: payments ? payments[0] : null,
        nextAction: paymentIntent.attributes.next_action
      };
    } catch (error) {
      console.error('PayMongo get payment intent error:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.errors?.[0]?.detail || 'Failed to get payment status'
      };
    }
  }

  // Get test card
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