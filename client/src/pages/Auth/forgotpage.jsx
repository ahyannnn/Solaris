// pages/Auth/ForgotPasswordPage.jsx
import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaLock, FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/Salfare_Logo.png';
import { Helmet } from 'react-helmet-async';
import '../../styles/Auth/forgotpage.css';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Cooldown state
  const [cooldown, setCooldown] = useState(0);
  const [isCooldownActive, setIsCooldownActive] = useState(false);

  // Cooldown timer effect
  useEffect(() => {
    let timer;
    if (isCooldownActive && cooldown > 0) {
      timer = setTimeout(() => {
        setCooldown(prev => prev - 1);
      }, 1000);
    } else if (cooldown === 0) {
      setIsCooldownActive(false);
    }
    return () => clearTimeout(timer);
  }, [cooldown, isCooldownActive]);

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
    if (errors.email) setErrors({});
  };

  const handleCodeChange = (index, value) => {
    if (value.length <= 1) {
      const newCode = [...code];
      newCode[index] = value;
      setCode(newCode);

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

  // Format cooldown time
  const formatCooldown = () => {
    const minutes = Math.floor(cooldown / 60);
    const seconds = cooldown % 60;
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
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
        setStep(2);
        // Start cooldown for resend button
        setCooldown(60);
        setIsCooldownActive(true);
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
    } catch (error) {
      console.error('Reset success email error:', error);
    }
  };

  // Resend code with cooldown
  const handleResendCode = async () => {
    if (isCooldownActive) return;
    
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
        setCooldown(60);
        setIsCooldownActive(true);
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
    <>
      <Helmet>
        <title>Forgot Password | Salfer Engineering</title>
        <meta name="description" content="Reset your password for your Salfer Engineering account to continue managing your solar projects." />
      </Helmet>

      <div className="forgot-page-forgot">
        <div className="forgot-card-forgot">
          {/* Left Side - Branding */}
          <div className="forgot-branding-forgot">
            <div className="branding-content-forgot">
              <div className="brand-logo-forgot">
                <img src={logo} alt="Salfer Engineering" className="brand-logo-img-forgot" />
                <h1 className="brand-name-forgot">Salfer Engineering</h1>
              </div>
              <h2 className="brand-tagline-forgot">Solar Technology Enterprise</h2>
              <p className="brand-description-forgot">
                Reset your password to continue managing your solar projects
              </p>
              <div className="brand-features-forgot">
                <div className="brand-feature-forgot">
                  <span className="feature-dot-forgot"></span>
                  <span>Free Solar Estimate</span>
                </div>
                <div className="brand-feature-forgot">
                  <span className="feature-dot-forgot"></span>
                  <span>Professional Installation</span>
                </div>
                <div className="brand-feature-forgot">
                  <span className="feature-dot-forgot"></span>
                  <span>5-Year Warranty</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="forgot-form-container-forgot">
            <div className="forgot-form-wrapper-forgot">
              {/* Step 1: Email */}
              {step === 1 && (
                <>
                  <div className="form-header-forgot">
                    <h2 className="form-title-forgot">Forgot Password?</h2>
                    <p className="form-subtitle-forgot">
                      Enter your email and we'll send you a 6-digit code
                    </p>
                  </div>

                  {errors.email && (
                    <div className="general-error-forgot">
                      {errors.email}
                    </div>
                  )}

                  <form onSubmit={handleEmailSubmit} className="forgot-form-forgot">
                    <div className="form-group-forgot">
                      <label htmlFor="email" className="form-label-forgot">
                        Email Address
                      </label>
                      <div className="input-wrapper-forgot">
                        <FaEnvelope className="input-icon-forgot" />
                        <input
                          type="email"
                          id="email"
                          className={`form-input-forgot ${errors.email ? 'input-error-forgot' : ''}`}
                          placeholder="Enter your email"
                          value={email}
                          onChange={handleEmailChange}
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className={`forgot-submit-btn-forgot ${isLoading ? 'loading-forgot' : ''}`}
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
                  <div className="form-header-forgot">
                    <h2 className="form-title-forgot">Enter Code</h2>
                    <p className="form-subtitle-forgot">
                      We've sent a 6-digit code to <strong>{email}</strong>
                    </p>
                  </div>

                  {errors.code && (
                    <div className="general-error-forgot">
                      {errors.code}
                    </div>
                  )}

                  <form onSubmit={handleCodeSubmit} className="forgot-form-forgot">
                    <div className="code-input-group-forgot">
                      <div className="code-inputs-forgot">
                        {code.map((digit, index) => (
                          <input
                            key={index}
                            id={`code-${index}`}
                            type="text"
                            maxLength="1"
                            className={`code-input-forgot ${errors.code ? 'input-error-forgot' : ''}`}
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
                      className={`forgot-submit-btn-forgot ${isLoading ? 'loading-forgot' : ''}`}
                      disabled={isLoading}
                    >
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </button>

                    <div className="resend-code-forgot">
                      <p className="resend-text-forgot">
                        Didn't receive code?{' '}
                        <button
                          type="button"
                          className="resend-link-forgot"
                          onClick={handleResendCode}
                          disabled={isCooldownActive}
                        >
                          {isCooldownActive ? `Resend (${formatCooldown()})` : 'Resend'}
                        </button>
                      </p>
                    </div>
                  </form>
                </>
              )}

              {/* Step 3: New Password & Confirm Password */}
              {step === 3 && (
                <>
                  <div className="form-header-forgot">
                    <h2 className="form-title-forgot">Reset Password</h2>
                    <p className="form-subtitle-forgot">
                      Enter your new password
                    </p>
                  </div>

                  {errors.password && (
                    <div className="general-error-forgot">
                      {errors.password}
                    </div>
                  )}

                  <form onSubmit={handlePasswordSubmit} className="forgot-form-forgot">
                    {/* New Password */}
                    <div className="form-group-forgot">
                      <label htmlFor="newPassword" className="form-label-forgot">
                        New Password
                      </label>
                      <div className="input-wrapper-forgot">
                        <FaLock className="input-icon-forgot" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="newPassword"
                          className={`form-input-forgot ${errors.password ? 'input-error-forgot' : ''}`}
                          placeholder="Enter new password"
                          value={password}
                          onChange={handlePasswordChange}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="password-toggle-forgot"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.password && <span className="error-message-forgot">{errors.password}</span>}
                    </div>

                    {/* Confirm Password */}
                    <div className="form-group-forgot">
                      <label htmlFor="confirmPassword" className="form-label-forgot">
                        Confirm Password
                      </label>
                      <div className="input-wrapper-forgot">
                        <FaLock className="input-icon-forgot" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          className={`form-input-forgot ${errors.confirmPassword ? 'input-error-forgot' : ''}`}
                          placeholder="Confirm new password"
                          value={confirmPassword}
                          onChange={handleConfirmPasswordChange}
                          disabled={isLoading}
                        />
                        <button
                          type="button"
                          className="password-toggle-forgot"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.confirmPassword && <span className="error-message-forgot">{errors.confirmPassword}</span>}
                    </div>

                    <button
                      type="submit"
                      className={`forgot-submit-btn-forgot ${isLoading ? 'loading-forgot' : ''}`}
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
                  <div className="success-message-container-forgot">
                    <div className="success-icon-forgot">✓</div>
                    <h3 className="success-title-forgot">Password Changed!</h3>
                    <p className="success-text-forgot">
                      Your password has been reset successfully
                    </p>

                    <button
                      onClick={handleBackToLogin}
                      className="back-to-login-btn-forgot"
                    >
                      Back to Login
                    </button>
                  </div>
                </>
              )}

              {/* Sign Up Link - show on steps 1-3 only */}
              {step !== 4 && (
                <div className="signup-prompt-forgot">
                  <p className="signup-text-forgot">
                    Don't have an account?{' '}
                    <Link to="/register" className="signup-link-forgot">
                      Sign up
                    </Link>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;