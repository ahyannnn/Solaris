import React, { useState } from 'react';
import { FaSolarPanel, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../../styles/Auth/loginpage.css';

const LoginPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error for this field when user starts typing
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
      // Proceed with login
      console.log('Login attempt with:', formData);
      // Add your login logic here
    } else {
      setErrors(newErrors);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="login-page">
      {/* Login Card Container */}
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
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                    
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}

                {/* Forgot Password Link - Now below password field */}
                <div className="forgot-password-container">
                  <Link to="/forgotpassword" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
              </div>

              {/* Submit Button */}
              <button type="submit" className="login-submit-btn">
                Sign In
              </button>

              {/* Social Login - Only Google and Facebook with icons only */}
              <div className="social-login">
                <p className="social-login-text">Or continue with</p>
                <div className="social-buttons">
                  <button type="button" className="social-btn google">
                    <FaGoogle />
                  </button>
                  <button type="button" className="social-btn facebook">
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