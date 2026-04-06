const paymongoConfig = {
  secretKey: process.env.PAYMONGO_SECRET_KEY,
  publicKey: process.env.PAYMONGO_PUBLIC_KEY,
  baseURL: 'https://api.paymongo.com/v1',
  successUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}${process.env.PAYMENT_SUCCESS_URL || '/app/customer/payment-success'}`,
  cancelUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}${process.env.PAYMENT_CANCEL_URL || '/app/customer/payment-cancel'}`
};

module.exports = paymongoConfig;