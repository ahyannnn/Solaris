// pages/Auth/RegisterPage.jsx
import React, { useState, useEffect } from 'react';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaArrowLeft } from 'react-icons/fa';
import { FcGoogle } from 'react-icons/fc';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../firebase";
import { Helmet } from 'react-helmet-async';
import logo from '../../assets/Salfare_Logo.png';
import '../../styles/Auth/register.css';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [verifiedCode, setVerifiedCode] = useState(null);

  const [cooldown, setCooldown] = useState(0);
  const [isCooldownActive, setIsCooldownActive] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState('');
  const [modal, setModal] = useState({ show: false, message: '', type: '' });

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

  const showModal = (message, type = 'error') => {
    setModal({ show: true, message, type });
    setTimeout(() => setModal({ show: false, message: '', type: '' }), 5000);
  };

  const closeModal = () => setModal({ show: false, message: '', type: '' });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
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

  const openTermsInNewTab = () => {
    window.open('/terms', '_blank');
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
    if (!termsAccepted) newErrors.terms = 'You must agree to the Terms and Conditions';
    return newErrors;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (code.some(digit => !digit)) {
      newErrors.code = 'Please enter the 6-digit verification code';
    }
    return newErrors;
  };

  const handleSendVerification = async () => {
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.fullName
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || 'Failed to send verification code' });
      } else {
        setCurrentStep(2);
        setCooldown(60);
        setIsCooldownActive(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ general: 'Server error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async (e) => {
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
        headers: { 'Content-Type': 'application/json' },
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
        setVerifiedCode({
          email: formData.email,
          code: verificationCode
        });
        registerUser();
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ code: 'Server error. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  // In RegisterPage.jsx, in the registerUser function:

const registerUser = async () => {
  if (!verifiedCode) return;

  setIsLoading(true);

  try {
    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: formData.fullName,
        email: verifiedCode.email,
        password: formData.password
      })
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 409) {
        showModal(data.message || 'This email is already registered. Please sign in instead.', 'warning');
        setCurrentStep(1);
      } else {
        setErrors({ general: data.message || 'Registration failed' });
      }
    } else {
      // Store login data and setup status
      const storage = sessionStorage;
      storage.setItem("token", data.token);
      storage.setItem("userName", data.user.fullName);
      storage.setItem("userEmail", data.user.email);
      storage.setItem("userRole", data.user.role);
      storage.setItem("userId", data.user.id);
      storage.setItem("hasCompletedSetup", "false"); // New users need setup
      
      await sendWelcomeEmail();
      setCurrentStep(3);
      
      // Redirect to setup after 2 seconds
      setTimeout(() => {
        navigate("/setup", { replace: true });
      }, 2000);
    }
  } catch (error) {
    console.error('Registration error:', error);
    setErrors({ general: 'Failed to create account' });
  } finally {
    setIsLoading(false);
    setVerifiedCode(null);
  }
};

  const sendWelcomeEmail = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/email/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          name: formData.fullName
        })
      });
    } catch (error) {
      console.error('Welcome email error:', error);
    }
  };

  const handleResendCode = async () => {
    if (isCooldownActive) return;

    setIsLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const handleGoogleRegister = async () => {
    setSocialLoading('google');
    
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: user.displayName,
          email: user.email,
          googleId: user.uid,
          photoURL: user.photoURL
        })
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          showModal(data.message || 'An account with this email already exists. Please sign in instead.', 'warning');
        } else {
          showModal(data.message || "Google registration failed", 'error');
        }
        return;
      }

      sessionStorage.setItem("token", data.token);
      sessionStorage.setItem("userName", data.user.fullName);
      sessionStorage.setItem("userEmail", data.user.email);
      sessionStorage.setItem("userRole", data.user.role);
      if (data.user.photoURL) sessionStorage.setItem("userPhotoURL", data.user.photoURL);

      navigate("/app");

    } catch (error) {
      console.error("Google registration error:", error);
      if (error.code === 'auth/popup-closed-by-user') {
        showModal('Registration popup was closed. Please try again.', 'warning');
      } else {
        showModal('Failed to register with Google. Please try again.', 'error');
      }
    } finally {
      setSocialLoading('');
    }
  };

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const formatCooldown = () => {
    const minutes = Math.floor(cooldown / 60);
    const seconds = cooldown % 60;
    if (minutes > 0) {
      return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${seconds}s`;
  };

  return (
    <>
      <Helmet>
        <title>Create Account | Salfer Engineering</title>
        <meta name="description" content="Create a new account with Salfer Engineering to access solar solutions and manage your renewable energy projects." />
      </Helmet>

      <div className="register-page-reg">
        {/* Error Modal */}
        {modal.show && (
          <div className="modal-overlay-reg" onClick={closeModal}>
            <div className={`modal-content-reg ${modal.type}`} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header-reg">
                <span className="modal-icon-reg">{modal.type === 'warning' ? '⚠️' : '❌'}</span>
                <h3>{modal.type === 'warning' ? 'Account Already Exists' : 'Registration Failed'}</h3>
              </div>
              <div className="modal-body-reg">
                <p>{modal.message}</p>
                {modal.type === 'warning' && (
                  <p style={{ marginTop: '10px', fontSize: '14px' }}>
                    <Link to="/login" className="login-link-reg">Click here to sign in</Link>
                  </p>
                )}
              </div>
              <button className="modal-close-btn-reg" onClick={closeModal}>Got it</button>
            </div>
          </div>
        )}

        <div className="register-card-reg">
          {/* LEFT BRANDING */}
          <div className="register-branding-reg">
            <div className="branding-content-reg">
              <div className="brand-logo-reg">
                <img src={logo} alt="Salfer Engineering" className="brand-logo-img-reg" />
                <h1 className="brand-name-reg">Salfer Engineering</h1>
              </div>
              <h2 className="brand-tagline-reg">Solar Technology Enterprise</h2>
              <p className="brand-description-reg">
                Join Salfer Engineering to access solar solutions and manage your renewable energy projects.
              </p>
              <div className="brand-features-reg">
                <div className="brand-feature-reg"><span className="feature-dot-reg"></span> Free Solar Estimate</div>
                <div className="brand-feature-reg"><span className="feature-dot-reg"></span> Professional Installation</div>
                <div className="brand-feature-reg"><span className="feature-dot-reg"></span> 5-Year Warranty</div>
              </div>
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="register-form-container-reg">
            <div className="register-form-wrapper-reg">
              {/* Step 1: Account Details */}
              {currentStep === 1 && (
                <>
                  <div className="form-header-reg">
                    <h2 className="form-title-reg">Create Account</h2>
                    <p className="form-subtitle-reg">Enter your details to get started</p>
                  </div>

                  {errors.general && (
                    <div className="general-error-reg">
                      {errors.general}
                    </div>
                  )}

                  <form onSubmit={(e) => { e.preventDefault(); handleSendVerification(); }} className="register-form-reg">
                    <div className="form-group-reg">
                      <label className="form-label-reg">Full Name</label>
                      <div className="input-wrapper-reg">
                        <FaUser className="input-icon-reg" />
                        <input
                          type="text"
                          name="fullName"
                          className={`form-input-reg ${errors.fullName ? 'input-error-reg' : ''}`}
                          placeholder="Enter your full name"
                          value={formData.fullName}
                          onChange={handleChange}
                          disabled={isLoading || socialLoading !== ''}
                        />
                      </div>
                      {errors.fullName && <span className="error-message-reg">{errors.fullName}</span>}
                    </div>

                    <div className="form-group-reg">
                      <label className="form-label-reg">Email Address</label>
                      <div className="input-wrapper-reg">
                        <FaEnvelope className="input-icon-reg" />
                        <input
                          type="email"
                          name="email"
                          className={`form-input-reg ${errors.email ? 'input-error-reg' : ''}`}
                          placeholder="Enter your email"
                          value={formData.email}
                          onChange={handleChange}
                          disabled={isLoading || socialLoading !== ''}
                        />
                      </div>
                      {errors.email && <span className="error-message-reg">{errors.email}</span>}
                    </div>

                    <div className="form-group-reg">
                      <label className="form-label-reg">Password</label>
                      <div className="input-wrapper-reg">
                        <FaLock className="input-icon-reg" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          name="password"
                          className={`form-input-reg ${errors.password ? 'input-error-reg' : ''}`}
                          placeholder="Create a password"
                          value={formData.password}
                          onChange={handleChange}
                          disabled={isLoading || socialLoading !== ''}
                        />
                        <button
                          type="button"
                          className="password-toggle-reg"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading || socialLoading !== ''}
                        >
                          {showPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.password && <span className="error-message-reg">{errors.password}</span>}
                    </div>

                    <div className="form-group-reg">
                      <label className="form-label-reg">Confirm Password</label>
                      <div className="input-wrapper-reg">
                        <FaLock className="input-icon-reg" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          name="confirmPassword"
                          className={`form-input-reg ${errors.confirmPassword ? 'input-error-reg' : ''}`}
                          placeholder="Confirm your password"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          disabled={isLoading || socialLoading !== ''}
                        />
                        <button
                          type="button"
                          className="password-toggle-reg"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          disabled={isLoading || socialLoading !== ''}
                        >
                          {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                        </button>
                      </div>
                      {errors.confirmPassword && <span className="error-message-reg">{errors.confirmPassword}</span>}
                    </div>

                    {/* Terms and Conditions Checkbox */}
                    <div className="form-group-reg">
                      <label className="checkbox-label-reg">
                        <input
                          type="checkbox"
                          checked={termsAccepted}
                          onChange={(e) => setTermsAccepted(e.target.checked)}
                          className="terms-checkbox-reg"
                        />
                        <span className="checkbox-text-reg">
                          I agree to the{' '}
                          <button 
                            type="button" 
                            className="terms-link-reg"
                            onClick={openTermsInNewTab}
                          >
                            Terms and Conditions
                          </button>
                        </span>
                      </label>
                      {errors.terms && <span className="error-message-reg">{errors.terms}</span>}
                    </div>

                    <button
                      type="submit"
                      className="register-submit-btn-reg"
                      disabled={isLoading || socialLoading !== ''}
                    >
                      {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                    </button>

                    <div className="social-login-reg">
                      <p className="social-login-text-reg">Or sign up with</p>
                      <div className="social-buttons-reg">
                        <button
                          type="button"
                          className={`social-btn-reg google-reg ${socialLoading === 'google' ? 'loading-reg' : ''}`}
                          onClick={handleGoogleRegister}
                          disabled={isLoading || socialLoading !== ''}
                        >
                          {socialLoading === 'google' ? (
                            <span className="loading-spinner-reg"></span>
                          ) : (
                            <FcGoogle className="google-icon-reg" />
                          )}
                          <span className="google-text-reg">Continue with Google</span>
                        </button>
                      </div>
                    </div>

                    <div className="login-prompt-reg">
                      <p className="login-text-reg">
                        Already have an account? <Link to="/login" className="login-link-reg">Sign in</Link>
                      </p>
                    </div>
                  </form>
                </>
              )}

              {/* Step 2: Verification Code */}
              {currentStep === 2 && (
                <>
                  <div className="form-header-reg">
                    <h2 className="form-title-reg">Verify Your Email</h2>
                    <p className="form-subtitle-reg">
                      We've sent a 6-digit code to <strong>{formData.email}</strong>
                    </p>
                  </div>

                  {errors.code && (
                    <div className="general-error-reg">
                      {errors.code}
                    </div>
                  )}

                  <form onSubmit={handleVerifyCode} className="register-form-reg">
                    <div className="code-input-group-reg">
                      <div className="code-inputs-reg">
                        {code.map((digit, index) => (
                          <input
                            key={index}
                            id={`code-${index}`}
                            type="text"
                            maxLength="1"
                            className={`code-input-reg ${errors.code ? 'input-error-reg' : ''}`}
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
                      className="register-submit-btn-reg"
                      disabled={isLoading}
                    >
                      {isLoading ? 'Verifying...' : 'Verify Code'}
                    </button>

                    <div className="resend-code-reg">
                      <p className="resend-text-reg">
                        Didn't receive code?{' '}
                        <button
                          type="button"
                          className="resend-link-reg"
                          onClick={handleResendCode}
                          disabled={isCooldownActive}
                        >
                          {isCooldownActive ? `Resend (${formatCooldown()})` : 'Resend'}
                        </button>
                      </p>
                    </div>

                    <button
                      type="button"
                      className="back-button-reg"
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
                <div className="success-container-reg">
                  <div className="success-icon-reg">✓</div>
                  <h2 className="success-title-reg">Successfully Registered!</h2>
                  <p className="success-text-reg">
                    Your account has been created successfully. You can now log in to access your solar projects.
                  </p>
                  <button
                    onClick={handleBackToLogin}
                    className="back-to-login-btn-reg"
                  >
                    Back to Login
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;