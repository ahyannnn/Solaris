// pages/Auth/RegisterPage.jsx
import React, { useState, useEffect, useRef } from 'react';
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
  
  // Email validation states
  const [emailChecking, setEmailChecking] = useState(false);
  const [isEmailTaken, setIsEmailTaken] = useState(false);
  
  // Username validation states
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [isUsernameTaken, setIsUsernameTaken] = useState(false);
  
  // Debounce timer refs
  const emailDebounceTimerRef = useRef(null);
  const usernameDebounceTimerRef = useRef(null);
  
  // Add a ref to prevent double verification
  const isVerifyingRef = useRef(false);

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

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      if (emailDebounceTimerRef.current) {
        clearTimeout(emailDebounceTimerRef.current);
      }
      if (usernameDebounceTimerRef.current) {
        clearTimeout(usernameDebounceTimerRef.current);
      }
    };
  }, []);

  const showModal = (message, type = 'error') => {
    setModal({ show: true, message, type });
    setTimeout(() => setModal({ show: false, message: '', type: '' }), 5000);
  };

  const closeModal = () => setModal({ show: false, message: '', type: '' });

  // ==================== VALIDATION FUNCTIONS ====================

  // Username validation
  const validateUsername = (username) => {
    if (!username) return null;
    if (username.length < 3) return 'Username must be at least 3 characters';
    if (username.length > 20) return 'Username must be less than 20 characters';
    if (username.includes(' ')) return 'Username cannot contain spaces';
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return 'Username can only contain letters, numbers, and underscores';
    return null;
  };

  // Password validation - Complete rules
  const validatePassword = (password) => {
    if (!password) return null;
    
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password.length > 16) return 'Password must be less than 16 characters';
    if (!/[A-Z]/.test(password)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(password)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(password)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) return 'Password must contain at least one special character (!@#$%^&* etc.)';
    
    return null;
  };

  // Email validation
  const validateEmail = (email) => {
    if (!email) return null;
    if (!email.endsWith('@gmail.com')) return 'Please use a valid @gmail.com email address';
    if (email.length < 10) return 'Email is too short';
    if (email.length > 50) return 'Email is too long';
    return null;
  };

  // Function to check if email is already taken
  const checkEmailExists = async (email) => {
    if (!email || !email.endsWith('@gmail.com')) {
      setIsEmailTaken(false);
      setEmailChecking(false);
      return false;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/check-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.toLowerCase() })
      });

      const data = await response.json();
      
      if (data.exists) {
        setIsEmailTaken(true);
        setErrors(prev => ({ ...prev, email: 'Email is already taken' }));
        return true;
      } else {
        setIsEmailTaken(false);
        setErrors(prev => ({ ...prev, email: '' }));
        return false;
      }
    } catch (error) {
      console.error('Email check error:', error);
      setIsEmailTaken(false);
      return false;
    } finally {
      setEmailChecking(false);
    }
  };

  // Function to check if username is already taken
  const checkUsernameExists = async (username) => {
    if (!username || username.length < 3) {
      setIsUsernameTaken(false);
      setUsernameChecking(false);
      return false;
    }

    // Don't check if there's already a validation error
    const usernameError = validateUsername(username);
    if (usernameError) {
      setIsUsernameTaken(false);
      setUsernameChecking(false);
      return false;
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/check-username`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username })
      });

      const data = await response.json();
      
      if (data.exists) {
        setIsUsernameTaken(true);
        setErrors(prev => ({ ...prev, fullName: 'Username is already taken' }));
        return true;
      } else {
        setIsUsernameTaken(false);
        setErrors(prev => ({ ...prev, fullName: '' }));
        return false;
      }
    } catch (error) {
      console.error('Username check error:', error);
      setIsUsernameTaken(false);
      return false;
    } finally {
      setUsernameChecking(false);
    }
  };

  // Debounced email check (waits 3 seconds after user stops typing)
  const debouncedEmailCheck = (email) => {
    if (emailDebounceTimerRef.current) {
      clearTimeout(emailDebounceTimerRef.current);
    }
    
    if (!email || !email.endsWith('@gmail.com')) {
      setIsEmailTaken(false);
      setEmailChecking(false);
      return;
    }
    
    setEmailChecking(true);
    
    emailDebounceTimerRef.current = setTimeout(() => {
      checkEmailExists(email);
    }, 3000);
  };

  // Debounced username check (waits 3 seconds after user stops typing)
  const debouncedUsernameCheck = (username) => {
    if (usernameDebounceTimerRef.current) {
      clearTimeout(usernameDebounceTimerRef.current);
    }
    
    if (!username || username.length < 3) {
      setIsUsernameTaken(false);
      setUsernameChecking(false);
      return;
    }
    
    const usernameError = validateUsername(username);
    if (usernameError) {
      setIsUsernameTaken(false);
      setUsernameChecking(false);
      return;
    }
    
    setUsernameChecking(true);
    
    usernameDebounceTimerRef.current = setTimeout(() => {
      checkUsernameExists(username);
    }, 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Real-time validation for each field
    if (name === 'fullName') {
      const usernameError = validateUsername(value);
      setErrors(prev => ({ ...prev, fullName: usernameError || '' }));
      
      setIsUsernameTaken(false);
      
      if (usernameDebounceTimerRef.current) {
        clearTimeout(usernameDebounceTimerRef.current);
      }
      
      if (value && value.length >= 3 && !usernameError) {
        debouncedUsernameCheck(value);
      }
    }
    
    if (name === 'email') {
      const emailError = validateEmail(value);
      setErrors(prev => ({ ...prev, email: emailError || '' }));
      
      setIsEmailTaken(false);
      setEmailChecking(false);
      
      if (emailDebounceTimerRef.current) {
        clearTimeout(emailDebounceTimerRef.current);
      }
      
      if (value && value.endsWith('@gmail.com') && !emailError) {
        debouncedEmailCheck(value);
      }
    }
    
    if (name === 'password') {
      const passwordError = validatePassword(value);
      setErrors(prev => ({ ...prev, password: passwordError || '' }));
      
      // Also validate confirm password when password changes
      if (formData.confirmPassword && value !== formData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else if (formData.confirmPassword && value === formData.confirmPassword) {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
    
    if (name === 'confirmPassword') {
      if (value !== formData.password) {
        setErrors(prev => ({ ...prev, confirmPassword: 'Passwords do not match' }));
      } else {
        setErrors(prev => ({ ...prev, confirmPassword: '' }));
      }
    }
    
    // Clear general error when user types
    if (errors.general) {
      setErrors(prev => ({ ...prev, general: '' }));
    }
  };

  const handleEmailBlur = async () => {
    if (emailDebounceTimerRef.current) {
      clearTimeout(emailDebounceTimerRef.current);
    }
    if (formData.email && formData.email.endsWith('@gmail.com')) {
      const emailError = validateEmail(formData.email);
      if (!emailError) {
        setEmailChecking(true);
        await checkEmailExists(formData.email);
      }
    } else if (formData.email && !formData.email.endsWith('@gmail.com')) {
      setErrors(prev => ({ ...prev, email: 'Please use a valid @gmail.com email address' }));
    }
  };

  const handleUsernameBlur = async () => {
    if (usernameDebounceTimerRef.current) {
      clearTimeout(usernameDebounceTimerRef.current);
    }
    if (formData.fullName && formData.fullName.length >= 3) {
      const usernameError = validateUsername(formData.fullName);
      if (!usernameError) {
        setUsernameChecking(true);
        await checkUsernameExists(formData.fullName);
      }
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

  const openTermsInNewTab = () => {
    window.open('/terms', '_blank');
  };

  const validateStep1 = () => {
    const newErrors = {};
    
    // Username validation
    if (!formData.fullName) {
      newErrors.fullName = 'Username is required';
    } else {
      const usernameError = validateUsername(formData.fullName);
      if (usernameError) newErrors.fullName = usernameError;
      else if (isUsernameTaken) newErrors.fullName = 'Username is already taken';
    }
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
      else if (isEmailTaken) newErrors.email = 'Email is already taken';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Terms validation
    if (!termsAccepted) {
      newErrors.terms = 'You must agree to the Terms and Conditions';
    }
    
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

    // Final checks for email and username uniqueness
    const isEmailTakenCheck = await checkEmailExists(formData.email);
    const isUsernameTakenCheck = await checkUsernameExists(formData.fullName);
    
    if (isEmailTakenCheck || isUsernameTakenCheck) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
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
    
    // Prevent double verification
    if (isVerifyingRef.current) {
      console.log('Already verifying, skipping...');
      return;
    }
    
    const newErrors = validateStep2();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    isVerifyingRef.current = true;
    setIsLoading(true);
    setErrors({});

    const verificationCode = code.join('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/verify-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          code: verificationCode
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ code: data.message || 'Invalid verification code' });
        isVerifyingRef.current = false;
      } else {
        // Store verified data and register
        setVerifiedCode({
          email: formData.email.toLowerCase(),
          code: verificationCode
        });
        // Call register immediately
        await registerUser(formData.email.toLowerCase(), verificationCode);
      }
    } catch (error) {
      console.error('Error:', error);
      setErrors({ code: 'Server error. Please try again.' });
      isVerifyingRef.current = false;
    } finally {
      setIsLoading(false);
    }
  };

  const registerUser = async (email, verificationCode) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: formData.fullName,
          email: email,
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
        isVerifyingRef.current = false;
      } else {
        const storage = sessionStorage;
        storage.setItem("token", data.token);
        storage.setItem("userName", data.user.fullName);
        storage.setItem("userEmail", data.user.email);
        storage.setItem("userRole", data.user.role);
        storage.setItem("userId", data.user.id);
        storage.setItem("hasCompletedSetup", "false");

        await sendWelcomeEmail(email);
        setCurrentStep(3);

        setTimeout(() => {
          navigate("/setup", { replace: true });
        }, 2000);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setErrors({ general: 'Failed to create account' });
      isVerifyingRef.current = false;
    }
  };

  const sendWelcomeEmail = async (email) => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/email/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
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
          email: formData.email.toLowerCase(),
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
          email: user.email.toLowerCase(),
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

  // Helper function to check if form is valid (for button disable state)
  const isFormValid = () => {
    return (
      formData.fullName && 
      !validateUsername(formData.fullName) &&
      !isUsernameTaken &&
      formData.email && 
      !validateEmail(formData.email) &&
      !isEmailTaken &&
      formData.password && 
      !validatePassword(formData.password) &&
      formData.confirmPassword && 
      formData.password === formData.confirmPassword &&
      termsAccepted
    );
  };

  return (
    <>
      <Helmet>
        <title>Create Account | Salfer Engineering</title>
        <meta name="description" content="Create a new account with Salfer Engineering to access solar solutions and manage your renewable energy projects." />
      </Helmet>

      <div className="register-page-reg">
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
                <div className="brand-feature-reg"><span className="feature-dot-reg"></span> Up to 25-Year Warranty</div>
              </div>
            </div>
          </div>

          <div className="register-form-container-reg">
            <div className="register-form-wrapper-reg">
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
                    {/* USERNAME FIELD */}
                    <div className="form-group-reg">
                      <label className="form-label-reg">Username</label>
                      <div className="input-wrapper-reg">
                        <FaUser className="input-icon-reg" />
                        <input
                          type="text"
                          name="fullName"
                          className={`form-input-reg ${errors.fullName ? 'input-error-reg' : ''}`}
                          placeholder="Enter your username"
                          value={formData.fullName}
                          onChange={handleChange}
                          onBlur={handleUsernameBlur}
                          disabled={isLoading || socialLoading !== ''}
                        />
                        {usernameChecking && (
                          <div className="email-checking-reg">
                            <span className="checking-spinner"></span>
                          </div>
                        )}
                        {!usernameChecking && isUsernameTaken && formData.fullName && (
                          <div className="email-taken-reg">
                            <span className="taken-icon">✗</span>
                          </div>
                        )}
                        {!usernameChecking && !isUsernameTaken && formData.fullName && formData.fullName.length >= 3 && !errors.fullName && (
                          <div className="email-available-reg">
                            <span className="available-icon">✓</span>
                          </div>
                        )}
                      </div>
                      {errors.fullName && <span className="error-message-reg">{errors.fullName}</span>}
                      {usernameChecking && formData.fullName && formData.fullName.length >= 3 && (
                        <span className="checking-message-reg">Checking username availability...</span>
                      )}
                      {!usernameChecking && !isUsernameTaken && formData.fullName && formData.fullName.length >= 3 && !errors.fullName && (
                        <span className="success-message-reg">✓ Username available</span>
                      )}
                    </div>

                    {/* EMAIL FIELD */}
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
                          onBlur={handleEmailBlur}
                          disabled={isLoading || socialLoading !== ''}
                        />
                        {emailChecking && (
                          <div className="email-checking-reg">
                            <span className="checking-spinner"></span>
                          </div>
                        )}
                        {!emailChecking && isEmailTaken && formData.email && (
                          <div className="email-taken-reg">
                            <span className="taken-icon">✗</span>
                          </div>
                        )}
                        {!emailChecking && !isEmailTaken && formData.email && formData.email.endsWith('@gmail.com') && !errors.email && (
                          <div className="email-available-reg">
                            <span className="available-icon">✓</span>
                          </div>
                        )}
                      </div>

                      {emailChecking && formData.email && formData.email.endsWith('@gmail.com') && (
                        <span className="checking-message-reg">Checking email availability...</span>
                      )}

                      {errors.email && <span className="error-message-reg">{errors.email}</span>}

                      {!emailChecking && !isEmailTaken && formData.email && formData.email.endsWith('@gmail.com') && !errors.email && (
                        <span className="success-message-reg">✓ Email available</span>
                      )}
                    </div>

                    {/* PASSWORD FIELD */}
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
                      
                      {/* Password requirements hint */}
                      {formData.password && !errors.password && (
                        <div className="password-hints-reg">
                          <p className="hint-title-reg">Password must contain:</p>
                          <ul className="hint-list-reg">
                            <li className={formData.password.length >= 8 && formData.password.length <= 16 ? 'valid' : 'invalid'}>
                              {formData.password.length >= 8 && formData.password.length <= 16 ? '✓' : '○'} 8-16 characters
                            </li>
                            <li className={/[A-Z]/.test(formData.password) ? 'valid' : 'invalid'}>
                              {/[A-Z]/.test(formData.password) ? '✓' : '○'} Uppercase letter (A-Z)
                            </li>
                            <li className={/[a-z]/.test(formData.password) ? 'valid' : 'invalid'}>
                              {/[a-z]/.test(formData.password) ? '✓' : '○'} Lowercase letter (a-z)
                            </li>
                            <li className={/[0-9]/.test(formData.password) ? 'valid' : 'invalid'}>
                              {/[0-9]/.test(formData.password) ? '✓' : '○'} Number (0-9)
                            </li>
                            <li className={/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? 'valid' : 'invalid'}>
                              {/[!@#$%^&*(),.?":{}|<>]/.test(formData.password) ? '✓' : '○'} Special character (!@#$%^&* etc.)
                            </li>
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* CONFIRM PASSWORD FIELD */}
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
                      {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                        <span className="success-message-reg">✓ Passwords match</span>
                      )}
                    </div>

                    {/* TERMS AND CONDITIONS */}
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

                    {/* SUBMIT BUTTON */}
                    <button
                      type="submit"
                      className="register-submit-btn-reg"
                      disabled={isLoading || socialLoading !== '' || !isFormValid()}
                    >
                      {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                    </button>

                    {/* SOCIAL LOGIN */}
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

                    {/* LOGIN LINK */}
                    <div className="login-prompt-reg">
                      <p className="login-text-reg">
                        Already have an account? <Link to="/login" className="login-link-reg">Sign in</Link>
                      </p>
                    </div>
                  </form>
                </>
              )}

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