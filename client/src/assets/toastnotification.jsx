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
// TOAST NOTIFICATION COMPONENT — CLEAN STYLE
// ============================================================

const ToastNotification = ({
  show,
  message,
  type = 'success',
  duration = 5000,
  onClose,
}) => {
  const [isExiting, setIsExiting] = useState(false);

  // ============================================================
  // REFS & STATE TRACKING
  // ============================================================

  const fuseRef = useRef(null);
  const rafIdRef = useRef(null);
  const exitTimeoutRef = useRef(null);

  const startTimeRef = useRef(null);
  const remainingRef = useRef(duration);
  const isPausedRef = useRef(false);
  const isClosingRef = useRef(false);
  const sessionRef = useRef(0);

  const durationRef = useRef(duration);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    durationRef.current = duration;
  }, [duration]);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  // ============================================================
  // GET COLOR
  // ============================================================

  const getColor = () => {
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

  const color = getColor();

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
  // CLEANUP ANIMATIONS & TIMERS
  // ============================================================

  const stopAnimation = () => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  };

  const cleanupAll = () => {
    stopAnimation();
    if (exitTimeoutRef.current !== null) {
      clearTimeout(exitTimeoutRef.current);
      exitTimeoutRef.current = null;
    }
  };

  // ============================================================
  // CLOSE TOAST
  // ============================================================

  const triggerClose = (sessionId) => {
    if (sessionId !== sessionRef.current || isClosingRef.current) {
      return;
    }

    isClosingRef.current = true;
    isPausedRef.current = false;

    cleanupAll();

    if (fuseRef.current) {
      fuseRef.current.style.width = '0%';
    }

    setIsExiting(true);

    exitTimeoutRef.current = setTimeout(() => {
      if (sessionId !== sessionRef.current) {
        return;
      }
      exitTimeoutRef.current = null;
      if (onCloseRef.current) {
        onCloseRef.current();
      }
    }, 400);
  };

  // ============================================================
  // RAF ANIMATION LOOP
  // ============================================================

  const startAnimation = (sessionId) => {
    stopAnimation();

    const animate = (now) => {
      if (
        sessionId !== sessionRef.current ||
        isClosingRef.current ||
        isPausedRef.current
      ) {
        return;
      }

      if (startTimeRef.current === null) {
        startTimeRef.current = now;
      }

      const elapsed = now - startTimeRef.current;
      const currentDuration = Math.max(
        1,
        Number(durationRef.current) || 5000
      );
      const activeRemaining = Math.max(0, remainingRef.current - elapsed);

      const percent = Math.max(
        0,
        Math.min(100, (activeRemaining / currentDuration) * 100)
      );

      if (fuseRef.current) {
        fuseRef.current.style.width = `${percent}%`;
      }

      if (activeRemaining <= 0) {
        remainingRef.current = 0;
        startTimeRef.current = null;
        triggerClose(sessionId);
        return;
      }

      rafIdRef.current = requestAnimationFrame(animate);
    };

    rafIdRef.current = requestAnimationFrame(animate);
  };

  // ============================================================
  // LIFECYCLE / SHOW EFFECT
  // ============================================================

  useEffect(() => {
    sessionRef.current += 1;
    const currentSession = sessionRef.current;
    const safeDuration = Math.max(1, Number(duration) || 5000);

    cleanupAll();

    isPausedRef.current = false;
    isClosingRef.current = false;
    startTimeRef.current = null;
    remainingRef.current = safeDuration;

    if (!show) {
      setIsExiting(false);
      return () => cleanupAll();
    }

    setIsExiting(false);

    if (fuseRef.current) {
      fuseRef.current.style.width = '100%';
    }

    startAnimation(currentSession);

    return () => {
      cleanupAll();
    };
  }, [show, duration]);

  // ============================================================
  // PAUSE ON HOVER
  // ============================================================

  const handleMouseEnter = () => {
    if (isClosingRef.current || isPausedRef.current) {
      return;
    }

    if (startTimeRef.current !== null) {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }

    startTimeRef.current = null;
    isPausedRef.current = true;
    stopAnimation();

    const currentDuration = Math.max(
      1,
      Number(durationRef.current) || 5000
    );
    const frozenPercent = Math.max(
      0,
      Math.min(100, (remainingRef.current / currentDuration) * 100)
    );

    if (fuseRef.current) {
      fuseRef.current.style.width = `${frozenPercent}%`;
    }
  };

  // ============================================================
  // RESUME AFTER HOVER
  // ============================================================

  const handleMouseLeave = () => {
    if (isClosingRef.current || !isPausedRef.current) {
      return;
    }

    if (remainingRef.current <= 0) {
      isPausedRef.current = false;
      triggerClose(sessionRef.current);
      return;
    }

    isPausedRef.current = false;
    startTimeRef.current = null;
    startAnimation(sessionRef.current);
  };

  // ============================================================
  // MANUAL CLOSE
  // ============================================================

  const handleClose = () => {
    if (isClosingRef.current) {
      return;
    }

    if (startTimeRef.current !== null) {
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      remainingRef.current = Math.max(0, remainingRef.current - elapsed);
    }

    startTimeRef.current = null;
    isPausedRef.current = false;

    cleanupAll();
    triggerClose(sessionRef.current);
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
      className={`toast-notification type-${type} ${
        isExiting ? 'exit' : ''
      }`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        borderColor: color,
      }}
    >
      {/* FULL BORDER GLOW */}
      <div className="toast-border-glow" />

      {/* TOAST CONTENT */}
      <div className="toast-content">
        <div
          className="toast-icon-wrapper"
          style={{
            color: color,
          }}
        >
          {getIcon()}
        </div>

        <span className="toast-message">{message}</span>
      </div>

      {/* CLOSE BUTTON */}
      <button
        className="toast-close"
        onClick={handleClose}
        aria-label="Close notification"
      >
        <FaTimes />
      </button>

      {/* PROGRESS BAR */}
      <div className="toast-progress-track">
        <div
          ref={fuseRef}
          className="toast-progress-fuse"
          style={{
            width: '100%',
            background: color,
          }}
        />
      </div>
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

  const showToast = (
    message,
    type = 'success',
    duration = 5000
  ) => {
    setToast({
      show: true,
      message,
      type,
      duration,
    });
  };

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
// CSS (REMOVED BROKEN CSS TRANSITION PROPERTY)
// ============================================================

const toastStyles = `
/* ============================================================
   MAIN TOAST — CLEAN STYLE
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

  opacity: 1 !important;

  border-radius: 16px;

  /* FULL BORDER */
  border: 2px solid;

  box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);

  z-index: 999999;

  overflow: hidden;

  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;

  /* SLIDE IN ANIMATION */
  animation: slideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1);

  transition: transform 0.25s ease, box-shadow 0.3s ease;
}

/* ============================================================
   BORDER GLOW
============================================================ */

.toast-border-glow {
  position: absolute;
  inset: -2px;
  border-radius: 18px;
  padding: 2px;
  background: conic-gradient(from 0deg, #f39c12, #e67e22, #f1c40f, #d35400, #f39c12);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
  opacity: 0.4;
  animation: borderPulse 2s infinite alternate;
  transition: opacity 0.3s;
}

.toast-notification:hover .toast-border-glow {
  opacity: 0.8;
}

/* ============================================================
   HOVER
============================================================ */

.toast-notification:hover {
  transform: translateY(-3px) scale(1.02);
  box-shadow: 0 24px 60px rgba(0, 0, 0, 0.95);
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
  width: 40px;
  height: 40px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: rgba(255, 255, 255, 0.06) !important;

  font-size: 1.25rem;

  transition: transform 0.3s ease;
}

.toast-notification:hover .toast-icon-wrapper {
  transform: scale(1.1) rotate(4deg);
}

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
  width: 30px;
  height: 30px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 0;

  background: rgba(255, 255, 255, 0.05) !important;

  border: none;

  color: rgba(255, 255, 255, 0.4);

  cursor: pointer;

  border-radius: 8px;

  font-size: 0.875rem;

  position: relative;
  z-index: 3;

  transition: all 0.3s ease;
}

.toast-close:hover {
  color: #ffffff;
  background: rgba(255, 255, 255, 0.12) !important;
  transform: rotate(90deg) scale(1.1);
}

/* ============================================================
   PROGRESS BAR TRACK
============================================================ */

.toast-progress-track {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;

  height: 4px;

  background: rgba(255, 255, 255, 0.05) !important;

  border-radius: 0 0 16px 16px;

  overflow: hidden;

  z-index: 5;

  pointer-events: none;
}

/* ============================================================
   PROGRESS BAR
============================================================ */

.toast-progress-fuse {
  height: 100%;
  border-radius: 0 0 16px 16px;
  will-change: width;
}

/* ============================================================
   TYPE VARIANTS
============================================================ */

.toast-success {
  border-color: #2ecc71 !important;
}

.toast-success .toast-progress-fuse {
  background: #2ecc71 !important;
}

.toast-success .toast-icon-wrapper {
  color: #2ecc71 !important;
}

.toast-error {
  border-color: #e74c3c !important;
}

.toast-error .toast-progress-fuse {
  background: #e74c3c !important;
}

.toast-error .toast-icon-wrapper {
  color: #e74c3c !important;
}

.toast-warning {
  border-color: #f39c12 !important;
}

.toast-warning .toast-progress-fuse {
  background: #f39c12 !important;
}

.toast-warning .toast-icon-wrapper {
  color: #f39c12 !important;
}

.toast-info {
  border-color: #3498db !important;
}

.toast-info .toast-progress-fuse {
  background: #3498db !important;
}

.toast-info .toast-icon-wrapper {
  color: #3498db !important;
}

/* ============================================================
   SLIDE IN ANIMATION
============================================================ */

@keyframes slideIn {
  0% {
    opacity: 0;
    transform: translateX(40px) scale(0.95);
  }

  100% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }
}

/* ============================================================
   EXIT ANIMATION
============================================================ */

@keyframes slideOut {
  0% {
    opacity: 1;
    transform: translateX(0) scale(1);
  }

  100% {
    opacity: 0;
    transform: translateX(40px) scale(0.95);
  }
}

.toast-notification.exit {
  animation: slideOut 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards;
}

/* ============================================================
   BORDER PULSE
============================================================ */

@keyframes borderPulse {
  0% {
    opacity: 0.3;
  }

  100% {
    opacity: 0.7;
  }
}

/* ============================================================
   RESPONSIVE
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

@media (max-width: 480px) {
  .toast-notification {
    padding: 0.75rem 0.875rem;
    border-radius: 14px;
  }

  .toast-message {
    font-size: 0.8125rem;
  }

  .toast-icon-wrapper {
    width: 34px;
    height: 34px;
    font-size: 1rem;
  }

  .toast-icon {
    font-size: 0.875rem;
  }

  .toast-close {
    width: 28px;
    height: 28px;
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