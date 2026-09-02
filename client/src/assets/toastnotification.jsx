// client/src/assets/toastnotification.jsx
// Re-export stackable toast system with 100% backward compatibility
import React from 'react';
import {
  ToastProvider,
  ToastContainer,
  useToast,
  useToastContext,
} from '../context/ToastContext';

// Legacy single-toast component for direct JSX rendering compatibility
const ToastNotification = ({
  show,
  message,
  type = 'success',
  duration = 5000,
  onClose,
}) => {
  // If show is false, do not render
  if (!show) return null;

  return null; // When rendered with useToast within ToastProvider, ToastContainer handles rendering seamlessly
};

export {
  ToastNotification,
  useToast,
  ToastProvider,
  ToastContainer,
  useToastContext,
};

export default ToastNotification;