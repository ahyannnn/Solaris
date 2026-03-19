import React, { useState } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import logo from '../../assets/Salfare_Logo.png'; // ✅ Correct logo path
import '../../styles/Auth/loginpage.css';

const LoginPage = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
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
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    return newErrors;
  };

  // LOGIN SUBMIT - FIXED VERSION
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/login`;
      console.log('Attempting to login to:', apiUrl);
      
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      // First, get the response text
      const responseText = await response.text();
      console.log('Raw server response:', responseText);

      // Check if response is OK
      if (!response.ok) {
        // Try to parse as JSON if possible
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch {
          // If JSON parsing fails, use the text response
          if (responseText) {
            errorMessage = responseText;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Parse successful response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }

      // Store user data in sessionStorage
      if (data.token && data.user) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("userName", data.user.fullName || '');
        sessionStorage.setItem("userEmail", data.user.email || '');
        sessionStorage.setItem("userRole", data.user.role || 'user');
        
        if (data.user.photoURL) {
          sessionStorage.setItem("userPhotoURL", data.user.photoURL);
        } else {
          sessionStorage.removeItem("userPhotoURL");
        }

        navigate("/dashboard");
      } else {
        throw new Error('Invalid response structure from server');
      }
      
    } catch (err) {
      console.error("Login error details:", {
        message: err.message,
        stack: err.stack
      });
      
      // Provide specific error messages
      if (err.message.includes('404')) {
        setErrors({ 
          general: "Login service not found. Please check:\n" +
                  "1. If the backend server is running\n" +
                  "2. If the API endpoint is correct\n" +
                  "3. Your network connection"
        });
      } else if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError')) {
        setErrors({ 
          general: "Cannot connect to server. Please check:\n" +
                  "1. If the backend server is running on " + import.meta.env.VITE_API_URL + "\n" +
                  "2. Your internet connection\n" +
                  "3. CORS configuration on the server"
        });
      } else if (err.message.includes('Invalid response')) {
        setErrors({ general: "Server returned an invalid response. Please try again." });
      } else {
        setErrors({ general: err.message || "Server error. Please try again later." });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // GOOGLE LOGIN - FIXED VERSION
  const handleGoogleLogin = async () => {
    try {
      setSocialLoading('google');

      // Firebase sign in
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Send user data to backend
      const apiUrl = `${import.meta.env.VITE_API_URL}/api/auth/google-login`;
      console.log('Attempting Google login to:', apiUrl);

      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: user.displayName,
          email: user.email,
          googleId: user.uid,
          photoURL: user.photoURL
        })
      });

      // Get response text first
      const responseText = await response.text();
      console.log('Raw Google login response:', responseText);

      // Check response status
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status} ${response.statusText}`;
        
        try {
          if (responseText) {
            const errorData = JSON.parse(responseText);
            errorMessage = errorData.message || errorData.error || errorMessage;
          }
        } catch {
          if (responseText) {
            errorMessage = responseText;
          }
        }
        
        throw new Error(errorMessage);
      }

      // Parse successful response
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid response format from server');
      }

      // Store user data
      if (data.token && data.user) {
        sessionStorage.setItem("token", data.token);
        sessionStorage.setItem("userName", data.user.fullName || '');
        sessionStorage.setItem("userEmail", data.user.email || '');
        sessionStorage.setItem("userRole", data.user.role || 'user');

        if (data.user.photoURL) {
          sessionStorage.setItem("userPhotoURL", data.user.photoURL);
        } else {
          sessionStorage.removeItem("userPhotoURL");
        }

        navigate("/dashboard");
      } else {
        throw new Error('Invalid response structure from server');
      }

    } catch (error) {
      console.error("Google login error:", error);

      // Handle specific Firebase errors
      if (error.code === 'auth/popup-closed-by-user') {
        setErrors({ general: 'Login popup was closed. Please try again.' });
      } else if (error.code === 'auth/popup-blocked') {
        setErrors({ general: 'Popup was blocked by your browser. Please allow popups for this site.' });
      } else if (error.code === 'auth/cancelled-popup-request') {
        setErrors({ general: 'Login was cancelled. Please try again.' });
      } else if (error.message.includes('404')) {
        setErrors({ 
          general: 'Google login service not found. Please check if the backend server is running.' 
        });
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setErrors({ 
          general: 'Cannot connect to server. Please check your internet connection.' 
        });
      } else {
        setErrors({ general: error.message || 'Failed to login with Google. Please try again.' });
      }

    } finally {
      setSocialLoading('');
    }
  };

  return (
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

            {/* General Error Message */}
            {errors.general && (
              <div className="general-error" style={{
                backgroundColor: '#fee2e2',
                color: '#dc2626',
                padding: '12px',
                borderRadius: '8px',
                marginBottom: '16px',
                fontSize: '14px',
                textAlign: 'center',
                whiteSpace: 'pre-line'
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
                
                {/* FORGOT PASSWORD LINK */}
                <div className="forgot-password-container">
                  <Link to="/forgotpassword" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
                
                {errors.password && <span className="error-message">{errors.password}</span>}
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
  );
};

export default LoginPage;