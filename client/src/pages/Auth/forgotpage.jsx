import React, { useState } from 'react';
import { FaSolarPanel, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/Auth/forgotpage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: email, 2: code, 3: new password, 4: success
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors({});
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

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
    if (errors.password) setErrors({});
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPassword(e.target.value);
    if (errors.confirmPassword) setErrors({});
  };

  const validateEmail = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    return newErrors;
  };

  const validateCode = () => {
    const newErrors = {};
    if (code.some(digit => !digit)) {
      newErrors.code = 'Please enter the 6-digit code';
    }
    return newErrors;
  };

  const validatePassword = () => {
    const newErrors = {};
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[0-9])/.test(password)) {
      newErrors.password = 'Password must contain at least one number';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    return newErrors;
  };

  // STEP 1: Send reset code
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateEmail();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/send-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ email: data.message || 'Failed to send reset code' });
      } else {
        console.log('✅ Reset code sent to:', email);
        setStep(2);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ email: 'Server error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 2: Verify code
  const handleCodeSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateCode();
    
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
          email, 
          code: verificationCode 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ code: data.message || 'Invalid verification code' });
      } else {
        console.log('✅ Code verified for:', email);
        setStep(3);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ code: 'Server error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // STEP 3: Reset password
  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validatePassword();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          email, 
          password 
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ password: data.message || 'Failed to reset password' });
      } else {
        console.log('✅ Password reset successful for:', email);
        
        // Send success email (don't wait for it)
        sendResetSuccessEmail();
        
        setStep(4);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ password: 'Server error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // Send reset success email
  const sendResetSuccessEmail = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/email/send-reset-success`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      console.log('✅ Reset success email sent');
    } catch (error) {
      console.error('Reset success email error:', error);
    }
  };

  // Resend code
  const handleResendCode = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/send-reset-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ code: data.message || 'Failed to resend code' });
      } else {
        alert('✓ New verification code sent to your email!');
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
    <div className="forgot-page">
      <div className="forgot-card">
        {/* Left Side - Branding */}
        <div className="forgot-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <FaSolarPanel className="brand-icon" />
              <h1 className="brand-name">SOLARIS</h1>
            </div>
            <h2 className="brand-tagline">IoT-Based Solar Site Pre-Assessment System</h2>
            <p className="brand-description">
              Reset your password and continue with solar site assessment
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

        {/* Right Side - Form */}
        <div className="forgot-form-container">
          <div className="forgot-form-wrapper">
            {/* Step 1: Email */}
            {step === 1 && (
              <>
                <div className="form-header">
                  <h2 className="form-title">Forgot Password?</h2>
                  <p className="form-subtitle">
                    Enter your email and we'll send you a 6-digit code
                  </p>
                </div>

                {errors.email && (
                  <div className="general-error" style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    {errors.email}
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="forgot-form">
                  <div className="form-group">
                    <label htmlFor="email" className="form-label">
                      Email Address
                    </label>
                    <div className="input-wrapper">
                      <FaEnvelope className="input-icon" />
                      <input
                        type="email"
                        id="email"
                        className={`form-input ${errors.email ? 'input-error' : ''}`}
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleEmailChange}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    className={`forgot-submit-btn ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Sending...' : 'Send Code'}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: 6-digit Code */}
            {step === 2 && (
              <>
                <div className="form-header">
                  <h2 className="form-title">Enter Code</h2>
                  <p className="form-subtitle">
                    We've sent a 6-digit code to <strong>{email}</strong>
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

                <form onSubmit={handleCodeSubmit} className="forgot-form">
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
                    className={`forgot-submit-btn ${isLoading ? 'loading' : ''}`}
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
                </form>
              </>
            )}

            {/* Step 3: New Password & Confirm Password */}
            {step === 3 && (
              <>
                <div className="form-header">
                  <h2 className="form-title">Reset Password</h2>
                  <p className="form-subtitle">
                    Enter your new password
                  </p>
                </div>

                {errors.password && (
                  <div className="general-error" style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    padding: '12px',
                    borderRadius: '8px',
                    marginBottom: '16px',
                    fontSize: '14px',
                    textAlign: 'center'
                  }}>
                    {errors.password}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="forgot-form">
                  {/* New Password */}
                  <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <div className="input-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        className={`form-input ${errors.password ? 'input-error' : ''}`}
                        placeholder="Enter new password"
                        value={password}
                        onChange={handlePasswordChange}
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

                  {/* Confirm Password */}
                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm Password
                    </label>
                    <div className="input-wrapper">
                      <FaLock className="input-icon" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
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

                  <button 
                    type="submit" 
                    className={`forgot-submit-btn ${isLoading ? 'loading' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </form>
              </>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <>
                <div className="success-message-container">
                  <div className="success-icon">✓</div>
                  <h3 className="success-title">Password Changed!</h3>
                  <p className="success-text">
                    Your password has been reset successfully
                  </p>
                  
                  <button 
                    onClick={handleBackToLogin}
                    className="back-to-login-btn"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}

            {/* Sign Up Link - show on steps 1-3 only */}
            {step !== 4 && (
              <div className="signup-prompt">
                <p className="signup-text">
                  Don't have an account?{' '}
                  <Link to="/register" className="signup-link">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;