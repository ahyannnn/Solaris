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
  const [rememberMe, setRememberMe] = useState(false);
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
      newErrors.email = 'Email or User Name is required';
    } 

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    return newErrors;
  };

  // In LoginPage.jsx, after successful authentication, add setup check:

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
          email: formData.email,
          password: formData.password,
          rememberMe
        }),
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(parseError(responseText));
      }

      const data = JSON.parse(responseText);

      if (data.token && data.user) {
        clearAuthStorage();

        const storage = rememberMe ? localStorage : sessionStorage;
        const cleanedToken = cleanToken(data.token);

        const userData = {
          token: cleanedToken,
          userName: data.user.fullName || '',
          userEmail: data.user.email || '',
          userRole: data.user.role || 'user',
          userPhotoURL: data.user.photoURL || '',
          userId: data.user.id || ''
          // REMOVE hasCompletedSetup - don't store it
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
          // Always go to app - let SetupGuard handle redirect
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
          email: user.email,
          googleId: user.uid,
          photoURL: user.photoURL,
          rememberMe
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

        const storage = rememberMe ? localStorage : sessionStorage;
        const cleanedToken = cleanToken(data.token);

        const userData = {
          token: cleanedToken,
          userName: data.user.fullName || '',
          userEmail: data.user.email || '',
          userRole: data.user.role || 'user',
          userPhotoURL: data.user.photoURL || ''
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

  return (
    <>
      <Helmet>
        <title>Sign In | Salfer Engineering</title>
      </Helmet>

      <div className="login-page-login">
        <div className="login-card-login">
          {/* LEFT SIDE - Branding */}
          <div className="login-branding-login">
            <div className="branding-content-login">
              <div className="brand-logo-login">
                <img src={logo} alt="Salfer Engineering" className="brand-logo-img-login" />
                <h1 className="brand-name-login">Salfer Engineering</h1>
              </div>
              <h2 className="brand-tagline-login">
                Solar Technology Enterprise
              </h2>
              <p className="brand-description-login">
                DTI-registered solar company providing reliable, cost-effective solar solutions for Filipino homes and businesses since 2017.
              </p>
              <div className="brand-features-login">
                <div className="brand-feature-login">
                  <span className="feature-dot-login"></span>
                  <span>Free Solar Estimate</span>
                </div>
                <div className="brand-feature-login">
                  <span className="feature-dot-login"></span>
                  <span>Professional Installation</span>
                </div>
                <div className="brand-feature-login">
                  <span className="feature-dot-login"></span>
                  <span>5-Year Warranty</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Login Form */}
          <div className="login-form-container-login">
            <div className="login-form-wrapper-login">
              <div className="form-header-login">
                <h2 className="form-title-login">Welcome Back</h2>
                <p className="form-subtitle-login">
                  Sign in to manage your solar projects
                </p>
              </div>

              {/* Error Message */}
              {errors.general && (
                <div className="general-error-login">
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form-login">
                {/* EMAIL FIELD */}
                <div className="form-group-login">
                  <label className="form-label-login">Email or User Name</label>
                  <div className="input-wrapper-login">
                    <FaEnvelope className="input-icon-login" />
                    <input
                      type="text"
                      name="email"
                      className={`form-input-login ${errors.email ? 'input-error-login' : ''}`}
                      placeholder="Enter your email or username"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading || socialLoading !== '' || isNavigating}
                    />
                  </div>
                  {errors.email && <span className="error-message-login">{errors.email}</span>}
                </div>

                {/* PASSWORD FIELD */}
                <div className="form-group-login">
                  <label className="form-label-login">Password</label>
                  <div className="input-wrapper-login">
                    <FaLock className="input-icon-login" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={`form-input-login ${errors.password ? 'input-error-login' : ''}`}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading || socialLoading !== '' || isNavigating}
                    />
                    <button
                      type="button"
                      className="password-toggle-login"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading || socialLoading !== '' || isNavigating}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <span className="error-message-login">{errors.password}</span>}
                </div>

                {/* REMEMBER ME & FORGOT PASSWORD */}
                <div className="row-actions-login">


                  <Link to="/forgotpassword" className="forgot-link-login">
                    Forgot password?
                  </Link>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  className={`login-submit-btn-login ${isLoading ? 'loading-login' : ''}`}
                  disabled={isLoading || socialLoading !== '' || isNavigating}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* SOCIAL LOGIN */}
                <div className="social-login-login">
                  <p className="social-login-text-login">Or continue with</p>
                  <div className="social-buttons-login">
                    <button
                      type="button"
                      className={`social-btn-login google-login ${socialLoading === 'google' ? 'loading-login' : ''}`}
                      onClick={handleGoogleLogin}
                      disabled={isLoading || socialLoading !== '' || isNavigating}
                    >
                      {socialLoading === 'google' ? (
                        <span className="loading-spinner-login"></span>
                      ) : (
                        <>
                          <FcGoogle className="google-icon-login" />
                          <span className="google-text-login">Continue with Google</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* SIGN UP LINK */}
                <div className="signup-prompt-login">
                  <p className="signup-text-login">
                    Don't have an account?{' '}
                    <Link to="/register" className="signup-link-login">
                      Sign up
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LoginPage;