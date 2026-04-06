import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaSpinner, FaCreditCard } from 'react-icons/fa';

const CardPaymentForm = ({ paymentIntentId, amount, onSuccess, onError }) => {
  const [loading, setLoading] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    cardNumber: '',
    expMonth: '',
    expYear: '',
    cvc: ''
  });
  const [testCard, setTestCard] = useState(null);

  useEffect(() => {
    // Load test card for development
    const loadTestCard = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/payments/test-card`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (response.data.success) {
          setTestCard(response.data.testCard);
        }
      } catch (error) {
        console.log('Test card not available');
      }
    };
    loadTestCard();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCardDetails(prev => ({ ...prev, [name]: value }));
  };

  const fillTestCard = () => {
    if (testCard) {
      setCardDetails({
        cardNumber: testCard.cardNumber,
        expMonth: testCard.expMonth.toString(),
        expYear: testCard.expYear.toString(),
        cvc: testCard.cvc
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = sessionStorage.getItem('token');
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/payments/process-card-payment`,
        {
          paymentIntentId: paymentIntentId,
          cardDetails: {
            cardNumber: cardDetails.cardNumber.replace(/\s/g, ''),
            expMonth: parseInt(cardDetails.expMonth),
            expYear: parseInt(cardDetails.expYear),
            cvc: cardDetails.cvc
          }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        onSuccess(response.data);
      } else if (response.data.requiresAction) {
        // Handle 3DS if needed
        window.location.href = response.data.nextAction.redirect.url;
      } else {
        onError(response.data.message || 'Payment failed');
      }
    } catch (err) {
      console.error('Payment error:', err);
      onError(err.response?.data?.message || 'Payment processing failed');
    } finally {
      setLoading(false);
    }
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCardNumberChange = (e) => {
    const formatted = formatCardNumber(e.target.value);
    setCardDetails(prev => ({ ...prev, cardNumber: formatted }));
  };

  return (
    <form onSubmit={handleSubmit} className="card-payment-form">
      {testCard && (
        <div className="test-card-hint">
          <button type="button" onClick={fillTestCard} className="fill-test-card-btn">
            Fill Test Card (Always Succeeds)
          </button>
          <small>Test Card: 4343 4343 4343 4345</small>
        </div>
      )}

      <div className="form-group">
        <label>Card Number</label>
        <input
          type="text"
          name="cardNumber"
          value={cardDetails.cardNumber}
          onChange={handleCardNumberChange}
          placeholder="4343 4343 4343 4345"
          maxLength="19"
          required
          className="card-input"
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Expiry Month</label>
          <select
            name="expMonth"
            value={cardDetails.expMonth}
            onChange={handleInputChange}
            required
            className="card-select"
          >
            <option value="">MM</option>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => (
              <option key={m} value={m}>{m.toString().padStart(2, '0')}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Expiry Year</label>
          <select
            name="expYear"
            value={cardDetails.expYear}
            onChange={handleInputChange}
            required
            className="card-select"
          >
            <option value="">YYYY</option>
            {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i).map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>CVC</label>
          <input
            type="text"
            name="cvc"
            value={cardDetails.cvc}
            onChange={handleInputChange}
            placeholder="123"
            maxLength="4"
            required
            className="card-input-small"
          />
        </div>
      </div>

      <button type="submit" className="pay-button" disabled={loading}>
        {loading ? <FaSpinner className="spinning" /> : <FaCreditCard />}
        {loading ? 'Processing...' : `Pay ₱${amount.toLocaleString()}`}
      </button>
    </form>
  );
};

export default CardPaymentForm;