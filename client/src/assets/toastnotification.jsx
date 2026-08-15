// assets/toastnotification.jsx
import React, { useState, useEffect, useRef } from 'react';
import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaInfoCircle,
  FaTimesCircle,
  FaTimes,
} from 'react-icons/fa';

// ============================================================
// TOAST NOTIFICATION COMPONENT
// ============================================================

const ToastNotification = ({
  show,
  message,
  type = 'success',
  duration = 5000,
  onClose,
}) => {

  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  const animationRef = useRef(null);
  const startTimeRef = useRef(null);
  const elapsedRef = useRef(0);

  // ============================================================
  // GET BORDER COLOR
  // ============================================================

  const getBorderColor = () => {
    switch (type) {
      case 'success':
        return '#2ecc71';
      case 'error':
        return '#e74c3c';
      case 'warning':
        return '#f39c12';
      case 'info':
        return '#3498db';
      default:
        return '#2ecc71';
    }
  };

  const borderColor = getBorderColor();

  // ============================================================
  // GET ICON
  // ============================================================

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <FaCheckCircle className="toast-icon" />;
      case 'error':
        return <FaTimesCircle className="toast-icon" />;
      case 'warning':
        return <FaExclamationTriangle className="toast-icon" />;
      case 'info':
        return <FaInfoCircle className="toast-icon" />;
      default:
        return <FaCheckCircle className="toast-icon" />;
    }
  };

  // ============================================================
  // START / RESET TIMER
  // ============================================================

  useEffect(() => {
    if (!show) {
      setIsExiting(false);
      return;
    }

    setProgress(100);
    setIsPaused(false);
    setIsExiting(false);
    startTimeRef.current = null;
    elapsedRef.current = 0;

    animationRef.current = requestAnimationFrame(animateProgress);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [show, duration]);

  // ============================================================
  // PROGRESS ANIMATION - FUSE BURNING EFFECT
  // ============================================================

  const animateProgress = (timestamp) => {
    if (isPaused) return;

    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current + elapsedRef.current;
    const newProgress = Math.max(0, 100 - (elapsed / duration) * 100);

    setProgress(newProgress);

    if (newProgress > 0) {
      animationRef.current = requestAnimationFrame(animateProgress);
    } else {
      // Start exit animation before closing
      setIsExiting(true);
      setTimeout(() => {
        onClose();
      }, 300);
    }
  };

  // ============================================================
  // PAUSE ON HOVER
  // ============================================================

  const handleMouseEnter = () => {
    setIsPaused(true);

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }

    if (startTimeRef.current !== null) {
      const currentElapsed = performance.now() - startTimeRef.current + elapsedRef.current;
      elapsedRef.current = currentElapsed;
      startTimeRef.current = null;
    }
  };

  // ============================================================
  // RESUME AFTER HOVER
  // ============================================================

  const handleMouseLeave = () => {
    setIsPaused(false);
    startTimeRef.current = null;

    if (progress > 0) {
      animationRef.current = requestAnimationFrame(animateProgress);
    }
  };

  // ============================================================
  // HANDLE CLOSE
  // ============================================================

  const handleClose = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    setIsExiting(true);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  // ============================================================
  // DON'T SHOW
  // ============================================================

  if (!show) {
    return null;
  }

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div
      className={`toast-notification toast-${type} ${isExiting ? 'exit' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        borderLeft: `4px solid ${borderColor}`,
      }}
    >
      {/* ======================================================
          TOAST CONTENT
      ====================================================== */}

      <div className="toast-content">
        {/* ICON */}
        <div
          className="toast-icon-wrapper"
          style={{
            color: borderColor,
          }}
        >
          {getIcon()}
        </div>

        {/* MESSAGE */}
        <span className="toast-message">
          {message}
        </span>
      </div>

      {/* ======================================================
          CLOSE BUTTON
      ====================================================== */}

      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <FaTimes />
      </button>

      {/* ======================================================
          PROGRESS BAR - FUSE BURNING EFFECT
      ====================================================== */}

      <div className="toast-progress-track">
        <div
          className="toast-progress"
          style={{
            width: `${progress}%`,
            background: borderColor,
            boxShadow: `0 0 12px ${borderColor}`,
          }}
        />
      </div>

      {/* ======================================================
          BORDER GLOW EFFECT
      ====================================================== */}

      <div
        className="toast-border-glow"
        style={{
          background: `linear-gradient(90deg, ${borderColor}40, transparent)`,
        }}
      />
    </div>
  );
};

// ============================================================
// CUSTOM HOOK
// ============================================================

const useToast = (
  initialState = {
    show: false,
    message: '',
    type: 'success',
    duration: 5000,
  }
) => {
  const [toast, setToast] = useState(initialState);

  // ==========================================================
  // SHOW TOAST
  // ==========================================================

  const showToast = (message, type = 'success', duration = 5000) => {
    setToast({
      show: true,
      message,
      type,
      duration,
    });
  };

  // ==========================================================
  // HIDE TOAST
  // ==========================================================

  const hideToast = () => {
    setToast({
      show: false,
      message: '',
      type: 'success',
      duration: 5000,
    });
  };

  return {
    toast,
    showToast,
    hideToast,
    setToast,
  };
};

// ============================================================
// CSS
// ============================================================

const toastStyles = `

/* ============================================================
   MAIN TOAST
============================================================ */

.toast-notification {
  position: fixed;
  bottom: 2rem;
  right: 2rem;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 1rem;

  padding: 1rem 1.25rem;

  min-width: 320px;
  max-width: 450px;

  /* SOLID BLACK TOAST */
  background: #0d0d0d !important;
  background-color: #0d0d0d !important;

  /* MAKE SURE TOAST IS NOT TRANSPARENT */
  opacity: 1 !important;

  border-radius: 12px;

  /* VISIBLE BORDER */
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-left-width: 4px;

  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.8);

  z-index: 999999;

  overflow: hidden;

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  animation: slideInRight 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);

  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

/* ============================================================
   BORDER GLOW
============================================================ */

.toast-border-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 60px;
  height: 100%;
  opacity: 0.15;
  pointer-events: none;
  z-index: 0;
}

/* ============================================================
   HOVER
============================================================ */

.toast-notification:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.9);
}

/* ============================================================
   CONTENT
============================================================ */

.toast-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;

  flex: 1;
  min-width: 0;

  position: relative;
  z-index: 2;
}

/* ============================================================
   ICON WRAPPER
============================================================ */

.toast-icon-wrapper {
  width: 36px;
  height: 36px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  /* DARK ICON BACKGROUND */
  background: rgba(255, 255, 255, 0.06) !important;

  font-size: 1.25rem;

  transition: transform 0.3s ease;
}

.toast-notification:hover .toast-icon-wrapper {
  transform: scale(1.1);
}

/* ============================================================
   ICON
============================================================ */

.toast-icon {
  font-size: 1.125rem;
}

/* ============================================================
   MESSAGE
============================================================ */

.toast-message {
  color: #ffffff;

  font-size: 0.875rem;

  font-weight: 500;

  line-height: 1.5;

  letter-spacing: 0.01em;

  word-break: break-word;
}

/* ============================================================
   CLOSE BUTTON
============================================================ */

.toast-close {
  width: 28px;
  height: 28px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0;

  background: rgba(255, 255, 255, 0.05) !important;

  border: none;

  color: rgba(255, 255, 255, 0.4);

  cursor: pointer;

  border-radius: 6px;

  font-size: 0.875rem;

  position: relative;
  z-index: 3;

  transition: all 0.3s ease;
}

/* ============================================================
   CLOSE HOVER
============================================================ */

.toast-close:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12) !important;
  transform: rotate(90deg) scale(1.1);
}

/* ============================================================
   PROGRESS BAR TRACK - FUSE BACKGROUND
============================================================ */

.toast-progress-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  height: 3px;

  /* SOLID BLACK BACKGROUND */
  background: rgba(255, 255, 255, 0.05) !important;

  border-radius: 0 0 12px 12px;

  overflow: hidden;

  z-index: 5;

  pointer-events: none;
}

/* ============================================================
   PROGRESS BAR - FUSE BURNING EFFECT
   This is the colored bar that shrinks from 100% to 0%
   like a burning fuse
============================================================ */

.toast-progress {
  height: 100%;

  transition: width 0.1s linear;

  /* GLOW EFFECT - LIKE A BURNING FUSE */
  box-shadow: 0 0 20px currentColor;
}

/* ============================================================
   SUCCESS
============================================================ */

.toast-success {
  border-left-color: #2ecc71 !important;
}

.toast-success .toast-progress {
  background: #2ecc71 !important;
  color: #2ecc71;
}

.toast-success .toast-icon-wrapper {
  color: #2ecc71 !important;
}

/* ============================================================
   ERROR
============================================================ */

.toast-error {
  border-left-color: #e74c3c !important;
}

.toast-error .toast-progress {
  background: #e74c3c !important;
  color: #e74c3c;
}

.toast-error .toast-icon-wrapper {
  color: #e74c3c !important;
}

/* ============================================================
   WARNING
============================================================ */

.toast-warning {
  border-left-color: #f39c12 !important;
}

.toast-warning .toast-progress {
  background: #f39c12 !important;
  color: #f39c12;
}

.toast-warning .toast-icon-wrapper {
  color: #f39c12 !important;
}

/* ============================================================
   INFO
============================================================ */

.toast-info {
  border-left-color: #3498db !important;
}

.toast-info .toast-progress {
  background: #3498db !important;
  color: #3498db;
}

.toast-info .toast-icon-wrapper {
  color: #3498db !important;
}

/* ============================================================
   SLIDE IN ANIMATION
============================================================ */

@keyframes slideInRight {
  0% {
    transform: translateX(120%) scale(0.8);
    opacity: 0;
  }
  60% {
    transform: translateX(-10%) scale(1.02);
    opacity: 1;
  }
  100% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

/* ============================================================
   SLIDE OUT ANIMATION
============================================================ */

@keyframes slideOutRight {
  0% {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  100% {
    transform: translateX(120%) scale(0.8);
    opacity: 0;
  }
}

/* ============================================================
   EXIT
============================================================ */

.toast-notification.exit {
  animation: slideOutRight 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* ============================================================
   TABLET
============================================================ */

@media (max-width: 768px) {
  .toast-notification {
    bottom: 1rem;
    right: 1rem;
    left: 1rem;

    min-width: auto;
    max-width: none;

    padding: 0.875rem 1rem;
  }
}

/* ============================================================
   MOBILE
============================================================ */

@media (max-width: 480px) {
  .toast-notification {
    padding: 0.75rem 0.875rem;
    border-radius: 10px;
  }

  .toast-message {
    font-size: 0.8125rem;
  }

  .toast-icon-wrapper {
    width: 30px;
    height: 30px;
    font-size: 1rem;
  }

  .toast-icon {
    font-size: 0.875rem;
  }

  .toast-close {
    width: 26px;
    height: 26px;
    font-size: 0.75rem;
  }
}

`;

// ============================================================
// INJECT CSS
// ============================================================

if (typeof document !== 'undefined') {
  const styleId = 'toast-notification-styles';
  const existingStyle = document.getElementById(styleId);

  if (!existingStyle) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = toastStyles;
    document.head.appendChild(style);
  }
}

// ============================================================
// EXPORTS
// ============================================================

export { ToastNotification, useToast };
export default ToastNotification;