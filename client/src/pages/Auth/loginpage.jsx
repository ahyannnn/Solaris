import React, { useState } from 'react';
import { FaSolarPanel, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
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
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      
      setTimeout(() => {
        console.log('Login attempt with:', formData);
        
        // Store role in localStorage and redirect to /dashboard only
        if (formData.password === 'admin123') {
          localStorage.setItem('userRole', 'admin');
          localStorage.setItem('userName', 'Admin User');
          navigate('/dashboard');
        } else if (formData.password === 'engineer123') {
          localStorage.setItem('userRole', 'engineer');
          localStorage.setItem('userName', 'John Engineer');
          navigate('/dashboard');
        } else if (formData.password === 'customer123') {
          localStorage.setItem('userRole', 'customer');
          localStorage.setItem('userName', 'Maria Cruz');
          navigate('/dashboard');
        } else {
          setErrors({ password: 'Invalid credentials. Use: admin123, engineer123, or customer123' });
          setIsLoading(false);
        }
        
      }, 1500);
    } else {
      setErrors(newErrors);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleGoogleLogin = () => {
    console.log('Google login clicked');
  };

  const handleFacebookLogin = () => {
    console.log('Facebook login clicked');
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Left Side - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <FaSolarPanel className="brand-icon" />
              <h1 className="brand-name">SOLARIS</h1>
            </div>
            <h2 className="brand-tagline">IoT-Based Solar Site Pre-Assessment System</h2>
            <p className="brand-description">
              Collect, transmit, and review environmental data for solar installation planning
            </p>
            <div className="brand-features">
              <div className="brand-feature">
                <span className="feature-dot"></span>
                <span>Environmental Data Collection</span>
              </div>
              <div className="brand-feature">
                <span className="feature-dot"></span>
                <span>Temporary Site Deployment</span>
              </div>
              <div className="brand-feature">
                <span className="feature-dot"></span>
                <span>Data Reference for Planning</span>
              </div>
            </div>
            
            {/* Test credentials hint */}
            <div className="test-credentials">
              <p style={{ color: '#f39c12', fontSize: '0.8rem', marginBottom: '0.5rem', fontWeight: '600' }}>🔐 TEST CREDENTIALS:</p>
              <p style={{ color: '#e0e0e0', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Admin: any email + admin123</p>
              <p style={{ color: '#e0e0e0', fontSize: '0.75rem', marginBottom: '0.25rem' }}>Engineer: any email + engineer123</p>
              <p style={{ color: '#e0e0e0', fontSize: '0.75rem' }}>Customer: any email + customer123</p>
            </div>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="login-form-container">
          <div className="login-form-wrapper">
            <div className="form-header">
              <h2 className="form-title">Welcome Back</h2>
              <p className="form-subtitle">Please enter your details to sign in</p>
            </div>

            <form onSubmit={handleSubmit} className="login-form">
              {/* Email Field */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <div className="input-wrapper">
                  <FaEnvelope className="input-icon" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`form-input ${errors.email ? 'input-error' : ''}`}
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {/* Password Field */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}

                {/* Forgot Password Link */}
                <div className="forgot-password-container">
                  <Link to="/forgotpassword" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit" 
                className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* Social Login */}
              <div className="social-login">
                <p className="social-login-text">Or continue with</p>
                <div className="social-buttons">
                  <button 
                    type="button" 
                    className="social-btn google"
                    onClick={handleGoogleLogin}
                    disabled={isLoading}
                  >
                    <FaGoogle />
                  </button>
                  <button 
                    type="button" 
                    className="social-btn facebook"
                    onClick={handleFacebookLogin}
                    disabled={isLoading}
                  >
                    <FaFacebook />
                  </button>
                </div>
              </div>

              {/* Sign Up Link */}
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