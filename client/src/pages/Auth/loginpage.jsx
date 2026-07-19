// pages/Auth/LoginPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash, FaClock } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import logo from '../../assets/Salfare_Logo.png';
import { Helmet } from 'react-helmet-async';
import '../../styles/Auth/loginpage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [isNavigating, setIsNavigating] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showSplit, setShowSplit] = useState(false);
  const splitTimerRef = useRef(null);
  const navigationStartedRef = useRef(false);

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');

  const [attemptsRemaining, setAttemptsRemaining] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockMinutesRemaining, setLockMinutesRemaining] = useState(0);
  const [lockTimer, setLockTimer] = useState(null);
  const [emailError, setEmailError] = useState('');

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (lockTimer) {
        clearInterval(lockTimer);
      }
      if (splitTimerRef.current) {
        clearTimeout(splitTimerRef.current);
      }
    };
  }, [lockTimer]);

  // Helper to clean token
  const cleanToken = (token) => {
    if (!token) return null;
    return token.replace(/^["']|["']$/g, '').trim();
  };

  // Selective storage clearing
  const clearAuthStorage = () => {
    const keysToRemove = [
      'token',
      'userName',
      'userEmail',
      'userRole',
      'userPhotoURL'
    ];

    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
  };

  // Error parsing helper
  const parseError = (responseText) => {
    try {
      if (responseText) {
        const errorData = JSON.parse(responseText);
        return errorData.message || errorData.error || `Server error`;
      }
    } catch {
      return responseText || 'Login failed';
    }
    return 'Login failed';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });

    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }

    if (name === 'email') {
      setIsLocked(false);
      setAttemptsRemaining(null);
      setLockMinutesRemaining(0);
      if (lockTimer) {
        clearInterval(lockTimer);
        setLockTimer(null);
      }
      setEmailError('');
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) {
      newErrors.email = 'Email address is required';
    } else if (!formData.email.endsWith('@gmail.com')) {
      newErrors.email = 'Please use a valid @gmail.com email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  const startLockTimer = (minutes) => {
    if (lockTimer) {
      clearInterval(lockTimer);
    }

    let remainingMinutes = minutes;
    setLockMinutesRemaining(remainingMinutes);

    const timer = setInterval(() => {
      remainingMinutes -= 1;
      setLockMinutesRemaining(remainingMinutes);

      if (remainingMinutes <= 0) {
        clearInterval(timer);
        setLockTimer(null);
        setIsLocked(false);
        setAttemptsRemaining(5);
        setErrors({});
      }
    }, 60000);

    setLockTimer(timer);
  };

  // Trigger split animation and navigate - PURE SPLIT, NO FADE
  const triggerSplitAndNavigate = () => {
    if (navigationStartedRef.current) return;
    navigationStartedRef.current = true;
    
    setIsLoggingIn(true);
    setShowSplit(true);
    
    // Wait for split animation to complete (1.5s) then navigate directly
    splitTimerRef.current = setTimeout(() => {
      navigate("/app", { replace: true });
      // Reset states after navigation
      setTimeout(() => {
        setIsLoggingIn(false);
        setShowSplit(false);
        navigationStartedRef.current = false;
      }, 50);
    }, 1500); // Full split duration
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isNavigating || isLocked) return;

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setIsNavigating(true);
    setEmailError('');

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/login`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          password: formData.password,
          rememberMe: false
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        try {
          const errorData = JSON.parse(responseText);

          if (errorData.isLocked) {
            setIsLocked(true);
            setAttemptsRemaining(0);
            const minutes = errorData.lockMinutesRemaining || 10;
            startLockTimer(minutes);
            setErrors({ general: errorData.message });
            setIsLoading(false);
            setIsNavigating(false);
            return;
          }

          if (errorData.attemptsRemaining !== undefined) {
            setAttemptsRemaining(errorData.attemptsRemaining);
            setErrors({ general: errorData.message });
            setIsLoading(false);
            setIsNavigating(false);
            return;
          }

          throw new Error(errorData.message || 'Login failed');
        } catch (parseError) {
          throw new Error(parseError.message);
        }
      }

      const data = JSON.parse(responseText);

      if (data.token && data.user) {
        setIsLocked(false);
        setAttemptsRemaining(null);
        setLockMinutesRemaining(0);
        if (lockTimer) {
          clearInterval(lockTimer);
          setLockTimer(null);
        }

        clearAuthStorage();

        const storage = sessionStorage;
        const cleanedToken = cleanToken(data.token);

        const userData = {
          token: cleanedToken,
          userName: data.user.fullName || '',
          userEmail: data.user.email || '',
          userRole: data.user.role || 'user',
          userPhotoURL: data.user.photoURL || '',
          userId: data.user.id || ''
        };

        Object.entries(userData).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            storage.setItem(key, value);
          }
        });

        storage.removeItem('hasCompletedSetup');
        localStorage.removeItem('hasCompletedSetup');
        sessionStorage.removeItem('hasCompletedSetup');

        setIsLoading(false);
        setIsNavigating(false);
        triggerSplitAndNavigate();
      }

    } catch (err) {
      setErrors({ general: err.message });
      setIsLoading(false);
      setIsNavigating(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleAuthError = (error) => {
    console.error("Auth error:", error);

    if (error.code?.includes('popup') || error.code === 'auth/popup-closed-by-user') {
      setErrors({ general: 'Login cancelled. Please try again.' });
    } else if (error.code === 'auth/popup-blocked') {
      setErrors({ general: 'Popup blocked. Please allow popups and try again.' });
    } else if (error.code === 'auth/network-request-failed') {
      setErrors({ general: 'Network error. Please check your connection.' });
    } else {
      setErrors({ general: error.message || 'Login failed' });
    }
    setSocialLoading('');
    setIsNavigating(false);
  };

  const handleGoogleLogin = async () => {
    if (socialLoading === 'google' || isNavigating || isLocked) return;

    try {
      setSocialLoading('google');
      setErrors({});

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      if (!user.email.endsWith('@gmail.com')) {
        throw new Error('Please use a Gmail account to sign in.');
      }

      const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/google-login`;

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: user.displayName,
          email: user.email.toLowerCase(),
          googleId: user.uid,
          photoURL: user.photoURL,
          rememberMe: false
        })
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(parseError(responseText));
      }

      const data = JSON.parse(responseText);

      if (data.token && data.user) {
        clearAuthStorage();

        const storage = sessionStorage;
        const cleanedToken = cleanToken(data.token);

        const userData = {
          token: cleanedToken,
          userName: data.user.fullName || '',
          userEmail: data.user.email || '',
          userRole: data.user.role || 'user',
          userPhotoURL: data.user.photoURL || '',
          userId: data.user.id || ''
        };

        Object.entries(userData).forEach(([key, value]) => {
          storage.setItem(key, value);
        });

        setSocialLoading('');
        triggerSplitAndNavigate();
      }

    } catch (error) {
      handleAuthError(error);
    }
  };

  const getBrandingContent = () => {
    return {
      title: 'Login to your account',
      subtitle: 'Sign in to your account',
      description: 'Access your solar projects, track installations, and manage your renewable energy solutions.',
      features: ['Free Solar Estimate', 'Professional Installation', 'Up to 25-Year Warranty']
    };
  };

  const isFormLeft = true;

  return (
    <>
      <Helmet>
        <title>Sign In | Salfer Engineering</title>
      </Helmet>

      <div className={`new-login-page ${showSplit ? 'split-active' : ''}`}>
        {/* FORM SECTION - Always on LEFT */}
        <div className={`new-login-form-container ${isFormLeft ? 'form-left' : 'form-right'} ${showSplit ? 'split-slide-left' : ''}`}>
          <div className="new-login-form-wrapper">
            <div className="new-login-form-header">
              <h2 className="new-login-form-title">
                {isLocked ? 'Account Locked' : 'Login to your account'}
              </h2>
              <p className="new-login-form-subtitle">
                {isLocked
                  ? `Please wait ${lockMinutesRemaining} minute(s) before trying again`
                  : 'Sign in to manage your solar projects'
                }
              </p>
            </div>

            {errors.general && (
              <div className={`new-login-general-error ${isLocked ? 'new-login-lock-error' : ''}`}>
                {isLocked && <FaClock className="new-login-lock-icon" />}
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="new-login-form">
              <div className="new-login-form-group">
                <label className="new-login-form-label">Email Address</label>
                <div className="new-login-input-wrapper">
                  <FaEnvelope className="new-login-input-icon" />
                  <input
                    type="email"
                    name="email"
                    className={`new-login-form-input ${errors.email ? 'new-login-input-error' : ''}`}
                    placeholder="Enter your email address"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isNavigating || isLocked || isLoggingIn}
                  />
                </div>
                {errors.email && <span className="new-login-error-message">{errors.email}</span>}
              </div>

              <div className="new-login-form-group">
                <label className="new-login-form-label">Password</label>
                <div className="new-login-input-wrapper">
                  <FaLock className="new-login-input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`new-login-form-input ${errors.password ? 'new-login-input-error' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isNavigating || isLocked || isLoggingIn}
                  />
                  <button
                    type="button"
                    className="new-login-password-toggle"
                    onClick={togglePasswordVisibility}
                    disabled={isNavigating || isLocked || isLoggingIn}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="new-login-error-message">{errors.password}</span>}
              </div>

              <div className="new-login-row-actions">
                <Link to="/forgotpassword" className="new-login-forgot-link">
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                className={`new-login-submit-btn ${isLoading ? 'new-login-loading' : ''} ${isLocked ? 'new-login-btn-disabled' : ''}`}
                disabled={isLoading || socialLoading !== '' || isNavigating || isLocked || isLoggingIn}
              >
                {isLocked
                  ? `Locked (${lockMinutesRemaining}m remaining)`
                  : isLoading
                    ? 'Signing in...'
                    : 'Sign In'
                }
              </button>

              <div className="new-login-social">
                <p className="new-login-social-text">Or continue with</p>
                <div className="new-login-social-buttons">
                  <button
                    type="button"
                    className={`new-login-social-btn new-login-google-btn ${isLocked ? 'new-login-btn-disabled' : ''}`}
                    onClick={handleGoogleLogin}
                    disabled={isLoading || socialLoading !== '' || isNavigating || isLocked || isLoggingIn}
                  >
                    {socialLoading === 'google' ? (
                      <span className="new-login-loading-spinner"></span>
                    ) : (
                      <>
                        <FcGoogle className="new-login-google-icon" />
                        <span className="new-login-google-text">Continue with Google</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              <div className="new-login-signup-prompt">
                <p className="new-login-signup-text">
                  Don't have an account?{' '}
                  <Link to="/register" className="new-login-signup-link">
                    Sign up
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>

        {/* BRANDING SECTION - Always on RIGHT */}
        <div className={`new-login-branding branding-right ${showSplit ? 'split-slide-right' : ''}`}>
          <div className="new-login-branding-content">
            <div className="new-login-brand-header">
              <img src={logo} alt="Salfer Engineering" className="new-login-brand-logo" />
              <h1 className="new-login-brand-name">Salfer Engineering</h1>
            </div>
            <h2 className="new-login-brand-tagline">
              {getBrandingContent().title}
            </h2>
            <p className="new-login-brand-description">
              {getBrandingContent().description}
            </p>
            <div className="new-login-brand-features">
              {getBrandingContent().features.map((feature, index) => (
                <div className="new-login-brand-feature" key={index}>
                  <span className="new-login-feature-dot"></span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;