import React, { useState } from 'react';
import { FaSolarPanel, FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import '../../styles/Auth/register.css';

const RegisterPage = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    acceptTerms: false
  });
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
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
    
    if (!formData.fullName) {
      newErrors.fullName = 'Full name is required';
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[0-9])/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    
    if (Object.keys(newErrors).length === 0) {
      console.log('Registration attempt with:', formData);
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="register-page">
      {/* Register Card Container */}
      <div className="register-card">
        {/* Left Side - Branding */}
        <div className="register-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <FaSolarPanel className="brand-icon" />
              <h1 className="brand-name">SOLARIS</h1>
            </div>
            <h2 className="brand-tagline">IoT-Based Solar Site Pre-Assessment System</h2>
            <p className="brand-description">
              Join SOLARIS to access environmental data for solar installation planning
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

        {/* Right Side - Register Form */}
        <div className="register-form-container">
          <div className="register-form-wrapper">
            <div className="form-header">
              <h2 className="form-title">Create Account</h2>
              <p className="form-subtitle">Join SOLARIS for solar site assessment</p>
            </div>

            <form onSubmit={handleSubmit} className="register-form">
              {/* Full Name */}
              <div className="form-group">
                <label htmlFor="fullName" className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <FaUser className="input-icon" />
                  <input
                    type="text"
                    id="fullName"
                    name="fullName"
                    className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                    placeholder="Enter your full name"
                    value={formData.fullName}
                    onChange={handleChange}
                  />
                </div>
                {errors.fullName && <span className="error-message">{errors.fullName}</span>}
              </div>

              {/* Email */}
              <div className="form-group">
                <label htmlFor="email" className="form-label">Email Address</label>
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

              {/* Password */}
              <div className="form-group">
                <label htmlFor="password" className="form-label">Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    name="password"
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              {/* Confirm Password */}
              <div className="form-group">
                <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    name="confirmPassword"
                    className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              {/* Terms Checkbox */}
              <div className="form-checkbox">
                <input
                  type="checkbox"
                  id="acceptTerms"
                  name="acceptTerms"
                  checked={formData.acceptTerms}
                  onChange={handleChange}
                />
                <label htmlFor="acceptTerms">
                  I agree to the <Link to="/terms" className="terms-link">Terms</Link> and{' '}
                  <Link to="/privacy" className="terms-link">Privacy Policy</Link>
                </label>
              </div>
              {errors.acceptTerms && <span className="error-message">{errors.acceptTerms}</span>}

              {/* Submit Button */}
              <button type="submit" className="register-submit-btn">
                Create Account
              </button>

              {/* Social Login */}
              <div className="social-login">
                <p className="social-login-text">Or sign up with</p>
                <div className="social-buttons">
                  <button type="button" className="social-btn google">
                    <FaGoogle />
                  </button>
                  <button type="button" className="social-btn facebook">
                    <FaFacebook />
                  </button>
                </div>
              </div>

              {/* Login Link */}
              <div className="login-prompt">
                <p className="login-text">
                  Already have an account?{' '}
                  <Link to="/login" className="login-link">
                    Sign in
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

export default RegisterPage;