import React, { useState } from 'react';
import CardPaymentForm from './CardPaymentForm';
import GCashPaymentButton from './GCashPaymentButton';
import { FaTimes, FaSpinner } from 'react-icons/fa';
//import '../../styles/components/paymongo-modal.css';

const PayMongoPaymentModal = ({ isOpen, onClose, amount, description, onSuccess, type, id, paymentId }) => {
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSuccess = (data) => {
    onSuccess(data);
    onClose();
  };

  return (
    <div className="paymongo-modal-overlay" onClick={onClose}>
      <div className="paymongo-modal" onClick={e => e.stopPropagation()}>
        <button className="paymongo-modal-close" onClick={onClose}>
          <FaTimes />
        </button>

        <h3>Complete Payment</h3>
        
        <div className="paymongo-payment-summary">
          <p className="paymongo-amount">Amount: ₱{amount.toLocaleString()}</p>
          <p className="paymongo-description">{description}</p>
        </div>

        <div className="paymongo-payment-methods">
          <h4>Select Payment Method</h4>
          
          <div className="paymongo-method-options">
            <div 
              className={`paymongo-method-option ${paymentMethod === 'gcash' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('gcash')}
            >
              <input type="radio" checked={paymentMethod === 'gcash'} readOnly />
              <div className="paymongo-method-icon">📱</div>
              <div className="paymongo-method-info">
                <strong>GCash</strong>
                <small>Pay using GCash mobile wallet</small>
              </div>
            </div>

            <div 
              className={`paymongo-method-option ${paymentMethod === 'card' ? 'selected' : ''}`}
              onClick={() => setPaymentMethod('card')}
            >
              <input type="radio" checked={paymentMethod === 'card'} readOnly />
              <div className="paymongo-method-icon">💳</div>
              <div className="paymongo-method-info">
                <strong>Credit/Debit Card</strong>
                <small>Visa, Mastercard, JCB</small>
              </div>
            </div>
          </div>
        </div>

        {paymentMethod === 'gcash' && (
          <GCashPaymentButton
            amount={amount}
            description={description}
            type={type}
            id={id}
            paymentId={paymentId}
            onSuccess={handleSuccess}
            onError={(error) => console.error(error)}
          />
        )}

        {paymentMethod === 'card' && (
          <CardPaymentForm
            amount={amount}
            description={description}
            type={type}
            id={id}
            paymentId={paymentId}
            onSuccess={handleSuccess}
            onError={(error) => console.error(error)}
          />
        )}

        {loading && (
          <div className="paymongo-loading">
            <FaSpinner className="spinning" />
            <span>Processing payment...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default PayMongoPaymentModal;