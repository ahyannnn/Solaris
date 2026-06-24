// pages/Auth/LoginPage.jsx
import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
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

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');

  // Helper to clean token
  const cleanToken = (token) => {
    if (!token) return null;
    return token.replace(/^["']|["']$/g, '').trim();
  };

  // IMPROVED: Selective storage clearing (NO FLICKERING!)
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
    // DON'T clear everything - preserves Firebase state & prevents conflicts
  };

  // IMPROVED: Error parsing helper
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isNavigating) return;

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});
    setIsNavigating(true);

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
          if (value !== undefined && value !== null) {
            storage.setItem(key, value);
          }
        });

        // Clear any stale setup flag
        storage.removeItem('hasCompletedSetup');
        localStorage.removeItem('hasCompletedSetup');
        sessionStorage.removeItem('hasCompletedSetup');

        setTimeout(() => {
          window.dispatchEvent(new Event('storage'));
          navigate("/app", { replace: true });
        }, 50);
      }

    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setIsLoading(false);
      setIsNavigating(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // IMPROVED: Centralized error handling
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
  };

  // IMPROVED: Google Login (ANTI-FLICKER)
  const handleGoogleLogin = async () => {
    if (socialLoading === 'google' || isNavigating) return;

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
        // SELECTIVE CLEAR - NO FLICKERING!
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

        setTimeout(() => {
          window.dispatchEvent(new Event('storage'));
          navigate("/app", { replace: true });
        }, 50);
      }

    } catch (error) {
      handleAuthError(error);
    } finally {
      setSocialLoading('');
      setIsNavigating(false);
    }
  };

  // Get branding content
  const getBrandingContent = () => {
    return {
      title: 'Login to your account',
      subtitle: 'Sign in to your account',
      description: 'Access your solar projects, track installations, and manage your renewable energy solutions.',
      features: ['Free Solar Estimate', 'Professional Installation', 'Up to 25-Year Warranty']
    };
  };

  // Form is always on LEFT for login
  const isFormLeft = true;

  return (
    <>
      <Helmet>
        <title>Sign In | Salfer Engineering</title>
      </Helmet>

      <div className="new-login-page">
        {/* FORM SECTION - Always on LEFT */}
        <div className={`new-login-form-container ${isFormLeft ? 'form-left' : 'form-right'}`}>
          <div className="new-login-form-wrapper">
            <div className="new-login-form-header">
              <h2 className="new-login-form-title">Login to your account</h2>
              <p className="new-login-form-subtitle">
                Sign in to manage your solar projects
              </p>
            </div>

            {/* Error Message */}
            {errors.general && (
              <div className="new-login-general-error">
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="new-login-form">
              {/* EMAIL FIELD */}
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
                    disabled={isLoading || socialLoading !== '' || isNavigating}
                  />
                </div>
                {errors.email && <span className="new-login-error-message">{errors.email}</span>}
              </div>

              {/* PASSWORD FIELD */}
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
                    disabled={isLoading || socialLoading !== '' || isNavigating}
                  />
                  <button
                    type="button"
                    className="new-login-password-toggle"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading || socialLoading !== '' || isNavigating}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="new-login-error-message">{errors.password}</span>}
              </div>

              {/* FORGOT PASSWORD - Only this, no remember me */}
              <div className="new-login-row-actions">
                <Link to="/forgotpassword" className="new-login-forgot-link">
                  Forgot password?
                </Link>
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className={`new-login-submit-btn ${isLoading ? 'new-login-loading' : ''}`}
                disabled={isLoading || socialLoading !== '' || isNavigating}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* SOCIAL LOGIN */}
              <div className="new-login-social">
                <p className="new-login-social-text">Or continue with</p>
                <div className="new-login-social-buttons">
                  <button
                    type="button"
                    className={`new-login-social-btn new-login-google-btn ${socialLoading === 'google' ? 'new-login-loading' : ''}`}
                    onClick={handleGoogleLogin}
                    disabled={isLoading || socialLoading !== '' || isNavigating}
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

              {/* SIGN UP LINK */}
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
        <div className="new-login-branding branding-right">
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