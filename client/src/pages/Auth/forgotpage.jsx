// pages/Auth/ForgotPasswordPage.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  
  // Email checking states
  const [emailChecking, setEmailChecking] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  
  // Debounce timer ref
  const debounceTimerRef = useRef(null);
  
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

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (errors.email) setErrors({});
    
    // Reset email exists status when email changes
    setEmailExists(false);
    setEmailChecking(false);
    
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Only trigger debounced check if email has value
    if (value && value.includes('@')) {
      debouncedEmailCheck(value);
    }
  };

  // Function to check if email exists (for forgot password)
  const checkEmailExists = async (email) => {
    if (!email || !email.includes('@')) {
      setEmailExists(false);
      setEmailChecking(false);
      return false;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      const data = await response.json();
      
      if (data.exists) {
        setEmailExists(true);
        setErrors(prev => ({ ...prev, email: '' }));
        return true;
      } else {
        setEmailExists(false);
        setErrors(prev => ({ ...prev, email: 'No account found with this email address' }));
        return false;
      }
    } catch (error) {
      console.error('Email check error:', error);
      setEmailExists(false);
      return false;
    } finally {
      setEmailChecking(false);
    }
  };

  // Debounced email check (waits 3 seconds after user stops typing)
  const debouncedEmailCheck = (email) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    // Don't check if email is empty
    if (!email || !email.includes('@')) {
      setEmailExists(false);
      setEmailChecking(false);
      return;
    }
    
    // Set checking to true BEFORE the timeout
    setEmailChecking(true);
    
    debounceTimerRef.current = setTimeout(() => {
      checkEmailExists(email);
    }, 3000);
  };

  // Handle email blur (immediate check when leaving field)
  const handleEmailBlur = async () => {
    // Clear any pending debounce
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    // Check immediately on blur
    if (email && email.includes('@')) {
      setEmailChecking(true);
      await checkEmailExists(email);
    } else if (email && !email.includes('@')) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address' }));
    }
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
    } else if (!emailExists) {
      newErrors.email = 'No account found with this email address';
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

    // Double-check if email exists before sending
    const exists = await checkEmailExists(email);
    if (!exists) {
      setErrors({ email: 'No account found with this email address' });
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

  // Get step-specific branding content
  const getBrandingContent = (step) => {
    switch(step) {
      case 1:
        return {
          title: 'Forgot Password?',
          subtitle: 'Reset your password',
          description: 'Enter your email address and we\'ll send you a verification code to reset your password.',
          features: ['Secure Password Reset', 'Email Verification', 'Quick Recovery']
        };
      case 2:
        return {
          title: 'Verify Code',
          subtitle: 'Check your email',
          description: 'We\'ve sent a 6-digit verification code to your email. Enter it below to continue.',
          features: ['Secure Verification', 'Instant Access', 'Protect Your Account']
        };
      case 3:
        return {
          title: 'Create New Password',
          subtitle: 'Secure your account',
          description: 'Create a strong new password for your account. Make sure it\'s unique and secure.',
          features: ['Strong Password', 'Account Security', 'Peace of Mind']
        };
      case 4:
        return {
          title: 'Password Reset Complete!',
          subtitle: 'You\'re all set',
          description: 'Your password has been successfully reset. You can now log in with your new password.',
          features: ['Ready to Go', 'Secure Access', 'Welcome Back']
        };
      default:
        return {
          title: 'Forgot Password?',
          subtitle: 'Reset your password',
          description: 'Enter your email address and we\'ll send you a verification code.',
          features: ['Secure Password Reset', 'Email Verification', 'Quick Recovery']
        };
    }
  };

  // ===== FIXED POSITIONING LOGIC =====
  // Step 2: Form on LEFT, Branding on RIGHT
  // Steps 1, 3, 4: Form on RIGHT, Branding on LEFT
  const isStep2 = step === 2;

  return (
    <>
      <Helmet>
        <title>Forgot Password | Salfer Engineering</title>
        <meta name="description" content="Reset your password for your Salfer Engineering account to continue managing your solar projects." />
      </Helmet>

      <div className="new-forgot-page">
        {/* ===== BRANDING SECTION ===== */}
        {/* Step 2: Right | Steps 1, 3, 4: Left */}
        <div className={`new-forgot-branding ${isStep2 ? 'branding-right' : 'branding-left'}`}>
          <div className="new-forgot-branding-content">
            <div className="new-forgot-brand-header">
              <img src={logo} alt="Salfer Engineering" className="new-forgot-brand-logo" />
              <h1 className="new-forgot-brand-name">Salfer Engineering</h1>
            </div>
            <h2 className="new-forgot-brand-tagline">
              {getBrandingContent(step).title}
            </h2>
            <p className="new-forgot-brand-description">
              {getBrandingContent(step).description}
            </p>
            <div className="new-forgot-brand-features">
              {getBrandingContent(step).features.map((feature, index) => (
                <div className="new-forgot-brand-feature" key={index}>
                  <span className="new-forgot-feature-dot"></span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== FORM SECTION ===== */}
        {/* Step 2: Left | Steps 1, 3, 4: Right */}
        <div 
          key={step} // Force re-render when step changes
          className={`new-forgot-form-container ${isStep2 ? 'form-left' : 'form-right'}`}
        >
          <div className="new-forgot-form-wrapper">
            {/* Step 1: Email */}
            {step === 1 && (
              <>
                <div className="new-forgot-form-header">
                  <h2 className="new-forgot-form-title">Forgot Password?</h2>
                  <p className="new-forgot-form-subtitle">
                    Enter your email and we'll send you a 6-digit code
                  </p>
                </div>

                {errors.email && (
                  <div className="new-forgot-general-error">
                    {errors.email}
                  </div>
                )}

                <form onSubmit={handleEmailSubmit} className="new-forgot-form">
                  <div className="new-forgot-form-group">
                    <label htmlFor="email" className="new-forgot-form-label">
                      Email Address
                    </label>
                    <div className="new-forgot-input-wrapper">
                      <FaEnvelope className="new-forgot-input-icon" />
                      <input
                        type="email"
                        id="email"
                        className={`new-forgot-form-input ${errors.email ? 'new-forgot-input-error' : ''}`}
                        placeholder="Enter your email"
                        value={email}
                        onChange={handleEmailChange}
                        onBlur={handleEmailBlur}
                        disabled={isLoading}
                      />
                      {emailChecking && (
                        <div className="new-forgot-email-checking">
                          <span className="new-forgot-checking-spinner"></span>
                        </div>
                      )}
                      {!emailChecking && emailExists && email && (
                        <div className="new-forgot-email-exists">
                          <span className="new-forgot-exists-icon">✓</span>
                        </div>
                      )}
                    </div>
                    {emailChecking && email && email.includes('@') && (
                      <span className="new-forgot-checking-message">Checking email...</span>
                    )}
                    {!emailChecking && emailExists && email && (
                      <span className="new-forgot-success-message">✓ Email found</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className={`new-forgot-submit-btn ${isLoading ? 'new-forgot-loading' : ''}`}
                    disabled={isLoading || !emailExists}
                  >
                    {isLoading ? 'Sending...' : 'Send Code'}
                  </button>
                </form>
              </>
            )}

            {/* Step 2: 6-digit Code - FORM ON LEFT */}
            {step === 2 && (
              <>
                <div className="new-forgot-form-header">
                  <h2 className="new-forgot-form-title">Enter Code</h2>
                  <p className="new-forgot-form-subtitle">
                    We've sent a 6-digit code to <strong>{email}</strong>
                  </p>
                </div>

                {errors.code && (
                  <div className="new-forgot-general-error">
                    {errors.code}
                  </div>
                )}

                <form onSubmit={handleCodeSubmit} className="new-forgot-form">
                  <div className="new-forgot-code-input-group">
                    <div className="new-forgot-code-inputs">
                      {code.map((digit, index) => (
                        <input
                          key={index}
                          id={`code-${index}`}
                          type="text"
                          maxLength="1"
                          className={`new-forgot-code-input ${errors.code ? 'new-forgot-input-error' : ''}`}
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
                    className={`new-forgot-submit-btn ${isLoading ? 'new-forgot-loading' : ''}`}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <div className="new-forgot-resend-code">
                    <p className="new-forgot-resend-text">
                      Didn't receive code?{' '}
                      <button
                        type="button"
                        className="new-forgot-resend-link"
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
                <div className="new-forgot-form-header">
                  <h2 className="new-forgot-form-title">Reset Password</h2>
                  <p className="new-forgot-form-subtitle">
                    Enter your new password
                  </p>
                </div>

                {errors.password && (
                  <div className="new-forgot-general-error">
                    {errors.password}
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="new-forgot-form">
                  {/* New Password */}
                  <div className="new-forgot-form-group">
                    <label htmlFor="newPassword" className="new-forgot-form-label">
                      New Password
                    </label>
                    <div className="new-forgot-input-wrapper">
                      <FaLock className="new-forgot-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        id="newPassword"
                        className={`new-forgot-form-input ${errors.password ? 'new-forgot-input-error' : ''}`}
                        placeholder="Enter new password"
                        value={password}
                        onChange={handlePasswordChange}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="new-forgot-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && <span className="new-forgot-error-message">{errors.password}</span>}
                  </div>

                  {/* Confirm Password */}
                  <div className="new-forgot-form-group">
                    <label htmlFor="confirmPassword" className="new-forgot-form-label">
                      Confirm Password
                    </label>
                    <div className="new-forgot-input-wrapper">
                      <FaLock className="new-forgot-input-icon" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="confirmPassword"
                        className={`new-forgot-form-input ${errors.confirmPassword ? 'new-forgot-input-error' : ''}`}
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        disabled={isLoading}
                      />
                      <button
                        type="button"
                        className="new-forgot-password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="new-forgot-error-message">{errors.confirmPassword}</span>}
                    {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
                      <span className="new-forgot-success-message">✓ Passwords match</span>
                    )}
                  </div>

                  <button
                    type="submit"
                    className={`new-forgot-submit-btn ${isLoading ? 'new-forgot-loading' : ''}`}
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
                <div className="new-forgot-success-container">
                  <div className="new-forgot-success-icon">✓</div>
                  <h3 className="new-forgot-success-title">Password Changed!</h3>
                  <p className="new-forgot-success-text">
                    Your password has been reset successfully
                  </p>

                  <button
                    onClick={handleBackToLogin}
                    className="new-forgot-back-to-login-btn"
                  >
                    Back to Login
                  </button>
                </div>
              </>
            )}

            {/* Sign Up Link - show on steps 1-3 only */}
            {step !== 4 && (
              <div className="new-forgot-signup-prompt">
                <p className="new-forgot-signup-text">
                  Don't have an account?{' '}
                  <Link to="/register" className="new-forgot-signup-link">
                    Sign up
                  </Link>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPasswordPage;