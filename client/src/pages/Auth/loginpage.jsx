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

  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');

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
      newErrors.email = 'Email is required';
    }
    else if (!formData.email.endsWith('@gmail.com')) {
      newErrors.email = 'Please use a valid @gmail.com email address';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    return newErrors;
  };

  // EMAIL/PASSWORD LOGIN
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

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
        let errorMessage = `Server error: ${response.status}`;
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch {
          errorMessage = responseText;
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);

      if (data.token && data.user) {
        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem("token", data.token);
        storage.setItem("userName", data.user.fullName || '');
        storage.setItem("userEmail", data.user.email || '');
        storage.setItem("userRole", data.user.role || 'user');
        
        if (data.user.photoURL) {
          storage.setItem("userPhotoURL", data.user.photoURL);
        }

        // Redirect to dashboard
        navigate("/app");
      }
      
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // GOOGLE LOGIN - Popup version (siguradong gagana)
  const handleGoogleLogin = async () => {
    try {
      setSocialLoading('google');
      setErrors({});

      // Popup - walang redirect, modal lang
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check if Gmail
      if (!user.email.endsWith('@gmail.com')) {
        setErrors({ general: 'Please use a Gmail account to sign in.' });
        setSocialLoading('');
        return;
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
        let errorMessage = `Server error: ${response.status}`;
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch {
          errorMessage = responseText;
        }
        throw new Error(errorMessage);
      }

      const data = JSON.parse(responseText);

      if (data.token && data.user) {
        const storage = rememberMe ? localStorage : sessionStorage;
        
        storage.setItem("token", data.token);
        storage.setItem("userName", data.user.fullName || '');
        storage.setItem("userEmail", data.user.email || '');
        storage.setItem("userRole", data.user.role || 'user');

        if (data.user.photoURL) {
          storage.setItem("userPhotoURL", data.user.photoURL);
        }

        // Redirect to dashboard
        navigate("/app");
      }

    } catch (error) {
      console.error("Google login error:", error);
      
      if (error.code === 'auth/popup-closed-by-user') {
        setErrors({ general: 'Login popup was closed. Please try again.' });
      } else if (error.code === 'auth/popup-blocked') {
        setErrors({ general: 'Popup was blocked by your browser. Please allow popups.' });
      } else {
        setErrors({ general: error.message || 'Failed to login with Google.' });
      }
    } finally {
      setSocialLoading('');
    }
  };

  return (
    <>
      <Helmet>
        <title>Sign In | Salfer Engineering</title>
      </Helmet>
      
      <div className="login-page">
        <div className="login-card">
          {/* LEFT SIDE - Branding */}
          <div className="login-branding">
            <div className="branding-content">
              <div className="brand-logo">
                <img src={logo} alt="Salfer Engineering" className="brand-logo-img" />
                <h1 className="brand-name">Salfer Engineering</h1>
              </div>
              <h2 className="brand-tagline">
                Solar Technology Enterprise
              </h2>
              <p className="brand-description">
                DTI-registered solar company providing reliable, cost-effective solar solutions for Filipino homes and businesses since 2017.
              </p>
              <div className="brand-features">
                <div className="brand-feature">
                  <span className="feature-dot"></span>
                  <span>Free Solar Estimate</span>
                </div>
                <div className="brand-feature">
                  <span className="feature-dot"></span>
                  <span>Professional Installation</span>
                </div>
                <div className="brand-feature">
                  <span className="feature-dot"></span>
                  <span>5-Year Warranty</span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE - Login Form */}
          <div className="login-form-container">
            <div className="login-form-wrapper">
              <div className="form-header">
                <h2 className="form-title">Welcome Back</h2>
                <p className="form-subtitle">
                  Sign in to manage your solar projects
                </p>
              </div>

              {/* Error Message */}
              {errors.general && (
                <div className="general-error" style={{
                  backgroundColor: '#fee2e2',
                  color: '#dc2626',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '14px',
                  textAlign: 'center'
                }}>
                  {errors.general}
                </div>
              )}

              <form onSubmit={handleSubmit} className="login-form">
                {/* EMAIL FIELD */}
                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <div className="input-wrapper">
                    <FaEnvelope className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      className={`form-input ${errors.email ? 'input-error' : ''}`}
                      placeholder="Enter your email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={isLoading || socialLoading !== ''}
                    />
                  </div>
                  {errors.email && <span className="error-message">{errors.email}</span>}
                </div>

                {/* PASSWORD FIELD */}
                <div className="form-group">
                  <label className="form-label">Password</label>
                  <div className="input-wrapper">
                    <FaLock className="input-icon" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      name="password"
                      className={`form-input ${errors.password ? 'input-error' : ''}`}
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      disabled={isLoading || socialLoading !== ''}
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={togglePasswordVisibility}
                      disabled={isLoading || socialLoading !== ''}
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                  {errors.password && <span className="error-message">{errors.password}</span>}
                </div>

                {/* REMEMBER ME & FORGOT PASSWORD */}
                <div className="row-actions">
                  <label className="remember-label">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="remember-checkbox"
                      disabled={isLoading || socialLoading !== ''}
                    />
                    <span>Remember me</span>
                  </label>
                  
                  <Link to="/forgotpassword" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>

                {/* LOGIN BUTTON */}
                <button
                  type="submit"
                  className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
                  disabled={isLoading || socialLoading !== ''}
                >
                  {isLoading ? 'Signing in...' : 'Sign In'}
                </button>

                {/* SOCIAL LOGIN */}
                <div className="social-login">
                  <p className="social-login-text">Or continue with</p>
                  <div className="social-buttons">
                    <button
                      type="button"
                      className={`social-btn google ${socialLoading === 'google' ? 'loading' : ''}`}
                      onClick={handleGoogleLogin}
                      disabled={isLoading || socialLoading !== ''}
                    >
                      {socialLoading === 'google' ? (
                        <span className="loading-spinner"></span>
                      ) : (
                        <FcGoogle className="google-icon" />
                      )}
                    </button>
                  </div>
                </div>

                {/* SIGN UP LINK */}
                <div className="signup-prompt">
                  <p className="signup-text">
                    Don't have an account?{' '}
                    <Link to="/register" className="signup-link">
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