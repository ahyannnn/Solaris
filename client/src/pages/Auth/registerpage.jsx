import React, { useState } from 'react';
import { FaSolarPanel, FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Auth/register.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1); // 1: Details, 2: Verify Code, 3: Success
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const handleCodeChange = (index, value) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`code-${index + 1}`);
        if (nextInput) nextInput.focus();
      }
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) prevInput.focus();
    }
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    else if (!/(?=.*[0-9])/.test(formData.password)) newErrors.password = 'Password must contain at least one number';
    if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (code.some(digit => !digit)) {
      newErrors.code = 'Please enter the 6-digit verification code';
    }
    return newErrors;
  };

  // STEP 1: Send verification code
  const handleStep1Submit = async (e) => {
    e.preventDefault();
    const newErrors = validateStep1();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/send-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: formData.email,
          name: formData.fullName 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Failed to send verification code' });
      } else {
        console.log('✅ Verification code sent');
        setCurrentStep(2);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ general: 'Server error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify code
  const handleStep2Submit = async (e) => {
    e.preventDefault();
    const newErrors = validateStep2();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    const verificationCode = code.join('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/verify-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: formData.email,
          code: verificationCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.attemptsLeft) {
          setErrors({ code: `${data.message} (${data.attemptsLeft} attempts left)` });
        } else {
          setErrors({ code: data.message || 'Invalid verification code' });
        }
      } else {
        console.log('✅ Email verified successfully');
        // Now register the user in your database
        await registerUser();
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ code: 'Server error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Register user after verification
  const registerUser = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: formData.email,
          password: formData.password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Registration failed' });
        setCurrentStep(2); // Go back to verification step
      } else {
        // Send welcome email
        await sendWelcomeEmail();
        setCurrentStep(3);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Failed to create account' });
      setCurrentStep(2);
    }
  };

  // Send welcome email
  const sendWelcomeEmail = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/email/send-welcome`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: formData.email,
          name: formData.fullName
        })
      });
      // Don't wait for this, just fire and forget
    } catch (error) {
      console.error('Welcome email error:', error);
    }
  };

  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/resend-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email: formData.email,
          name: formData.fullName 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ code: data.message || 'Failed to resend code' });
      } else {
        alert('✓ New verification code sent to your email!');
        // Clear code inputs
        setCode(['', '', '', '', '', '']);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ code: 'Failed to resend code' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="register-page">
      <div className="register-card">
        {/* LEFT BRANDING */}
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
              <div className="brand-feature"><span className="feature-dot"></span> Environmental Data Collection</div>
              <div className="brand-feature"><span className="feature-dot"></span> Temporary Site Deployment</div>
              <div className="brand-feature"><span className="feature-dot"></span> Data Reference for Planning</div>
            </div>

            {/* Step Indicator */}
            <div className="step-indicator">
              <div className={`step-dot ${currentStep >= 1 ? 'active' : ''}`}>
                <span>1</span>
              </div>
              <div className={`step-line ${currentStep >= 2 ? 'active' : ''}`}></div>
              <div className={`step-dot ${currentStep >= 2 ? 'active' : ''}`}>
                <span>2</span>
              </div>
              <div className={`step-line ${currentStep >= 3 ? 'active' : ''}`}></div>
              <div className={`step-dot ${currentStep >= 3 ? 'active' : ''}`}>
                <span>3</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT FORM */}
        <div className="register-form-container">
          <div className="register-form-wrapper">
            {/* Step 1: Account Details */}
            {currentStep === 1 && (
              <>
                <div className="form-header">
                  <h2 className="form-title">Create Account</h2>
                  <p className="form-subtitle">Enter your details to get started</p>
                </div>

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

                <form onSubmit={handleStep1Submit} className="register-form">
                  {/* FULL NAME */}
                  <div className="form-group">
                    <label className="form-label">Full Name</label>
                    <div className="input-wrapper">
                      <FaUser className="input-icon" />
                      <input
                        type="text"
                        name="fullName"
                        className={`form-input ${errors.fullName ? 'input-error' : ''}`}
                        placeholder="Enter your full name"
                        value={formData.fullName}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.fullName && <span className="error-message">{errors.fullName}</span>}
                  </div>

                  {/* EMAIL */}
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
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && <span className="error-message">{errors.email}</span>}
                  </div>

                  {/* PASSWORD */}
                  <div className="form-group">
                    <label className="form-label">Password</label>
                    <div className="input-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className={`form-input ${errors.password ? 'input-error' : ''}`}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <button 
                        type="button" 
                        className="password-toggle" 
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && <span className="error-message">{errors.password}</span>}
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className="input-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading}
                      />
                      <button 
                        type="button" 
                        className="password-toggle" 
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
                  </div>

                  {/* SUBMIT */}
                  <button 
                    type="submit" 
                    className="register-submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>

                  {/* LOGIN LINK */}
                  <div className="login-prompt">
                    <p className="login-text">
                      Already have an account? <Link to="/login" className="login-link">Sign in</Link>
                    </p>
                  </div>
                </form>
              </>
            )}

            {/* Step 2: Verification Code */}
            {currentStep === 2 && (
              <>
                <div className="form-header">
                  <h2 className="form-title">Verify Your Email</h2>
                  <p className="form-subtitle">
                    We've sent a 6-digit code to <strong>{formData.email}</strong>
                  </p>
                </div>

                {errors.code && (
                  <div className="general-error" style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    {errors.code}
                  </div>
                )}

                <form onSubmit={handleStep2Submit} className="register-form">
                  <div className="code-input-group">
                    <div className="code-inputs">
                      {code.map((digit, index) => (
                        <input
                          key={index}
                          id={`code-${index}`}
                          type="text"
                          maxLength="1"
                          className={`code-input ${errors.code ? 'input-error' : ''}`}
                          value={digit}
                          onChange={(e) => handleCodeChange(index, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(index, e)}
                          disabled={isLoading}
                        />
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className="register-submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <div className="resend-code">
                    <p className="resend-text">
                      Didn't receive code?{' '}
                      <button 
                        type="button"
                        className="resend-link"
                        onClick={handleResendCode}
                        disabled={isLoading}
                      >
                        Resend
                      </button>
                    </p>
                  </div>

                  <button 
                    type="button"
                    className="back-button"
                    onClick={() => setCurrentStep(1)}
                    disabled={isLoading}
                  >
                    <FaArrowLeft /> Back to Registration
                  </button>
                </form>
              </>
            )}

            {/* Step 3: Success */}
            {currentStep === 3 && (
              <div className="success-container">
                <div className="success-icon">✓</div>
                <h2 className="success-title">Successfully Registered!</h2>
                <p className="success-text">
                  Your account has been created successfully. You can now log in to access SOLARIS.
                </p>
                <button 
                  onClick={handleBackToLogin}
                  className="back-to-login-btn"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;