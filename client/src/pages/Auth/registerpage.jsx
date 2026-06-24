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
    firstName: '',
    middleName: '',
    lastName: '',
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
  
  // Debounce timer refs
  const emailDebounceTimerRef = useRef(null);
  
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
    };
  }, []);

  const showModal = (message, type = 'error') => {
    setModal({ show: true, message, type });
    setTimeout(() => setModal({ show: false, message: '', type: '' }), 5000);
  };

  const closeModal = () => setModal({ show: false, message: '', type: '' });

  // ==================== VALIDATION FUNCTIONS ====================

  // First name validation
  const validateFirstName = (firstName) => {
    if (!firstName) return null;
    if (firstName.length < 2) return 'First name must be at least 2 characters';
    if (firstName.length > 50) return 'First name must be less than 50 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(firstName)) return 'First name can only contain letters, spaces, apostrophes, and hyphens';
    return null;
  };

  // Last name validation
  const validateLastName = (lastName) => {
    if (!lastName) return null;
    if (lastName.length < 2) return 'Last name must be at least 2 characters';
    if (lastName.length > 50) return 'Last name must be less than 50 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(lastName)) return 'Last name can only contain letters, spaces, apostrophes, and hyphens';
    return null;
  };

  // Middle name validation (optional)
  const validateMiddleName = (middleName) => {
    if (!middleName) return null;
    if (middleName.length > 50) return 'Middle name must be less than 50 characters';
    if (!/^[a-zA-Z\s'-]+$/.test(middleName)) return 'Middle name can only contain letters, spaces, apostrophes, and hyphens';
    return null;
  };

  // Password validation
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

  // Debounced email check
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    if (name === 'firstName') {
      const firstNameError = validateFirstName(value);
      setErrors(prev => ({ ...prev, firstName: firstNameError || '' }));
    }
    
    if (name === 'middleName') {
      const middleNameError = validateMiddleName(value);
      setErrors(prev => ({ ...prev, middleName: middleNameError || '' }));
    }
    
    if (name === 'lastName') {
      const lastNameError = validateLastName(value);
      setErrors(prev => ({ ...prev, lastName: lastNameError || '' }));
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
    
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    } else {
      const firstNameError = validateFirstName(formData.firstName);
      if (firstNameError) newErrors.firstName = firstNameError;
    }
    
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    } else {
      const lastNameError = validateLastName(formData.lastName);
      if (lastNameError) newErrors.lastName = lastNameError;
    }
    
    const middleNameError = validateMiddleName(formData.middleName);
    if (middleNameError) newErrors.middleName = middleNameError;
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else {
      const emailError = validateEmail(formData.email);
      if (emailError) newErrors.email = emailError;
      else if (isEmailTaken) newErrors.email = 'Email is already taken';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else {
      const passwordError = validatePassword(formData.password);
      if (passwordError) newErrors.password = passwordError;
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
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

    const isEmailTakenCheck = await checkEmailExists(formData.email);
    
    if (isEmailTakenCheck) {
      return;
    }

    setIsLoading(true);
    setErrors({});

    const fullName = `${formData.firstName} ${formData.lastName}`.trim();

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/send-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          name: fullName
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
        setVerifiedCode({
          email: formData.email.toLowerCase(),
          code: verificationCode
        });
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
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName,
          contactFirstName: formData.firstName,
          contactMiddleName: formData.middleName,
          contactLastName: formData.lastName,
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
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      await fetch(`${import.meta.env.VITE_API_URL}/api/email/send-welcome`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email,
          name: fullName
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
      const fullName = `${formData.firstName} ${formData.lastName}`.trim();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/email/resend-code`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.toLowerCase(),
          name: fullName
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

      const parsedName = parseGoogleName(user.displayName);

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google-register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName: user.displayName,
          contactFirstName: parsedName.firstName,
          contactMiddleName: parsedName.middleName,
          contactLastName: parsedName.lastName,
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

  const parseGoogleName = (displayName) => {
    if (!displayName) return { firstName: '', middleName: '', lastName: '' };
    
    const parts = displayName.trim().split(/\s+/);
    
    if (parts.length === 0) return { firstName: '', middleName: '', lastName: '' };
    if (parts.length === 1) return { firstName: parts[0], middleName: '', lastName: '' };
    if (parts.length === 2) return { firstName: parts[0], middleName: '', lastName: parts[1] };
    
    const firstName = parts[0];
    const lastName = parts[parts.length - 1];
    const middleName = parts.slice(1, -1).join(' ');
    
    return { firstName, middleName, lastName };
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

  const isFormValid = () => {
    return (
      formData.firstName && 
      !validateFirstName(formData.firstName) &&
      formData.lastName && 
      !validateLastName(formData.lastName) &&
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

  const getBrandingContent = (step) => {
    switch(step) {
      case 1:
        return {
          title: 'Create Account',
          subtitle: 'Start your solar journey',
          description: 'Join Salfer Engineering to access solar solutions and manage your renewable energy projects.',
          features: ['Free Solar Estimate', 'Professional Installation', 'Up to 25-Year Warranty']
        };
      case 2:
        return {
          title: 'Verify Email',
          subtitle: 'Almost there!',
          description: 'We\'ve sent a verification code to your email. Enter it below to complete your registration.',
          features: ['Secure Verification', 'Instant Access', 'Get Started Today']
        };
      case 3:
        return {
          title: 'Registration Complete!',
          subtitle: 'Welcome to Salfer Engineering',
          description: 'Your account has been successfully created. You can now access all our solar solutions and manage your projects.',
          features: ['Start Exploring', 'Manage Projects', 'Track Progress']
        };
      default:
        return {
          title: 'Create Account',
          subtitle: 'Start your solar journey',
          description: 'Join Salfer Engineering to access solar solutions.',
          features: ['Free Solar Estimate', 'Professional Installation', 'Up to 25-Year Warranty']
        };
    }
  };

  // ===== FIXED POSITIONING LOGIC =====
  // Step 2: Form on LEFT, Branding on RIGHT
  // Steps 1 & 3: Form on RIGHT, Branding on LEFT
  const isStep2 = currentStep === 2;

  return (
    <>
      <Helmet>
        <title>Create Account | Salfer Engineering</title>
        <meta name="description" content="Create a new account with Salfer Engineering to access solar solutions and manage your renewable energy projects." />
      </Helmet>

      <div className="new-register-page">
        {modal.show && (
          <div className="new-register-modal-overlay" onClick={closeModal}>
            <div className={`new-register-modal-content ${modal.type}`} onClick={(e) => e.stopPropagation()}>
              <div className="new-register-modal-header">
                <span className="new-register-modal-icon">{modal.type === 'warning' ? '⚠️' : '❌'}</span>
                <h3>{modal.type === 'warning' ? 'Account Already Exists' : 'Registration Failed'}</h3>
              </div>
              <div className="new-register-modal-body">
                <p>{modal.message}</p>
                {modal.type === 'warning' && (
                  <p style={{ marginTop: '10px', fontSize: '14px' }}>
                    <Link to="/login" className="new-register-login-link">Click here to sign in</Link>
                  </p>
                )}
              </div>
              <button className="new-register-modal-close-btn" onClick={closeModal}>Got it</button>
            </div>
          </div>
        )}

        {/* ===== BRANDING SECTION ===== */}
        {/* Step 2: Right | Steps 1 & 3: Left */}
        <div className={`new-register-branding ${isStep2 ? 'branding-right' : 'branding-left'}`}>
          <div className="new-register-branding-content">
            <div className="new-register-brand-header">
              <img src={logo} alt="Salfer Engineering" className="new-register-brand-logo" />
              <h1 className="new-register-brand-name">Salfer Engineering</h1>
            </div>
            <h2 className="new-register-brand-tagline">
              {getBrandingContent(currentStep).title}
            </h2>
            <p className="new-register-brand-description">
              {getBrandingContent(currentStep).description}
            </p>
            <div className="new-register-brand-features">
              {getBrandingContent(currentStep).features.map((feature, index) => (
                <div className="new-register-brand-feature" key={index}>
                  <span className="new-register-feature-dot"></span>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ===== FORM SECTION ===== */}
        {/* Step 2: Left | Steps 1 & 3: Right */}
        <div 
          key={currentStep} // Force re-render when step changes
          className={`new-register-form-container ${isStep2 ? 'form-left' : 'form-right'}`}
        >
          <div className="new-register-form-wrapper">
            {currentStep === 1 && (
              <>
                <div className="new-register-form-header">
                  <h2 className="new-register-form-title">Create Account</h2>
                  <p className="new-register-form-subtitle">Enter your details to get started</p>
                </div>

                {errors.general && (
                  <div className="new-register-general-error">
                    {errors.general}
                  </div>
                )}

                <form onSubmit={(e) => { e.preventDefault(); handleSendVerification(); }} className="new-register-form">
                  <div className="new-register-form-group">
                    <label className="new-register-form-label">First Name</label>
                    <div className="new-register-input-wrapper">
                      <FaUser className="new-register-input-icon" />
                      <input
                        type="text"
                        name="firstName"
                        className={`new-register-form-input ${errors.firstName ? 'new-register-input-error' : ''}`}
                        placeholder="Enter your first name"
                        value={formData.firstName}
                        onChange={handleChange}
                        disabled={isLoading || socialLoading !== ''}
                      />
                    </div>
                    {errors.firstName && <span className="new-register-error-message">{errors.firstName}</span>}
                  </div>

                  <div className="new-register-form-group">
                    <label className="new-register-form-label">Middle Name <span className="new-register-optional">(Optional)</span></label>
                    <div className="new-register-input-wrapper">
                      <FaUser className="new-register-input-icon" />
                      <input
                        type="text"
                        name="middleName"
                        className={`new-register-form-input ${errors.middleName ? 'new-register-input-error' : ''}`}
                        placeholder="Enter your middle name (optional)"
                        value={formData.middleName}
                        onChange={handleChange}
                        disabled={isLoading || socialLoading !== ''}
                      />
                    </div>
                    {errors.middleName && <span className="new-register-error-message">{errors.middleName}</span>}
                  </div>

                  <div className="new-register-form-group">
                    <label className="new-register-form-label">Last Name</label>
                    <div className="new-register-input-wrapper">
                      <FaUser className="new-register-input-icon" />
                      <input
                        type="text"
                        name="lastName"
                        className={`new-register-form-input ${errors.lastName ? 'new-register-input-error' : ''}`}
                        placeholder="Enter your last name"
                        value={formData.lastName}
                        onChange={handleChange}
                        disabled={isLoading || socialLoading !== ''}
                      />
                    </div>
                    {errors.lastName && <span className="new-register-error-message">{errors.lastName}</span>}
                  </div>

                  <div className="new-register-form-group">
                    <label className="new-register-form-label">Email Address</label>
                    <div className="new-register-input-wrapper">
                      <FaEnvelope className="new-register-input-icon" />
                      <input
                        type="email"
                        name="email"
                        className={`new-register-form-input ${errors.email ? 'new-register-input-error' : ''}`}
                        placeholder="Enter your email address"
                        value={formData.email}
                        onChange={handleChange}
                        onBlur={handleEmailBlur}
                        disabled={isLoading || socialLoading !== ''}
                      />
                      {emailChecking && (
                        <div className="new-register-email-checking">
                          <span className="new-register-checking-spinner"></span>
                        </div>
                      )}
                      {!emailChecking && isEmailTaken && formData.email && (
                        <div className="new-register-email-taken">
                          <span className="new-register-taken-icon">✗</span>
                        </div>
                      )}
                      {!emailChecking && !isEmailTaken && formData.email && formData.email.endsWith('@gmail.com') && !errors.email && (
                        <div className="new-register-email-available">
                          <span className="new-register-available-icon">✓</span>
                        </div>
                      )}
                    </div>
                    {emailChecking && formData.email && formData.email.endsWith('@gmail.com') && (
                      <span className="new-register-checking-message">Checking email availability...</span>
                    )}
                    {errors.email && <span className="new-register-error-message">{errors.email}</span>}
                    {!emailChecking && !isEmailTaken && formData.email && formData.email.endsWith('@gmail.com') && !errors.email && (
                      <span className="new-register-success-message">✓ Email available</span>
                    )}
                  </div>

                  <div className="new-register-form-group">
                    <label className="new-register-form-label">Password</label>
                    <div className="new-register-input-wrapper">
                      <FaLock className="new-register-input-icon" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        className={`new-register-form-input ${errors.password ? 'new-register-input-error' : ''}`}
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        disabled={isLoading || socialLoading !== ''}
                      />
                      <button
                        type="button"
                        className="new-register-password-toggle"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={isLoading || socialLoading !== ''}
                      >
                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.password && <span className="new-register-error-message">{errors.password}</span>}
                  </div>

                  <div className="new-register-form-group">
                    <label className="new-register-form-label">Confirm Password</label>
                    <div className="new-register-input-wrapper">
                      <FaLock className="new-register-input-icon" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        name="confirmPassword"
                        className={`new-register-form-input ${errors.confirmPassword ? 'new-register-input-error' : ''}`}
                        placeholder="Confirm your password"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        disabled={isLoading || socialLoading !== ''}
                      />
                      <button
                        type="button"
                        className="new-register-password-toggle"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        disabled={isLoading || socialLoading !== ''}
                      >
                        {showConfirmPassword ? <FaEyeSlash /> : <FaEye />}
                      </button>
                    </div>
                    {errors.confirmPassword && <span className="new-register-error-message">{errors.confirmPassword}</span>}
                    {formData.confirmPassword && !errors.confirmPassword && formData.password === formData.confirmPassword && (
                      <span className="new-register-success-message">✓ Passwords match</span>
                    )}
                  </div>

                  <div className="new-register-form-group">
                    <label className="new-register-checkbox-label">
                      <input
                        type="checkbox"
                        checked={termsAccepted}
                        onChange={(e) => setTermsAccepted(e.target.checked)}
                        className="new-register-terms-checkbox"
                      />
                      <span className="new-register-checkbox-text">
                        I agree to the{' '}
                        <button
                          type="button"
                          className="new-register-terms-link"
                          onClick={openTermsInNewTab}
                        >
                          Terms and Conditions
                        </button>
                      </span>
                    </label>
                    {errors.terms && <span className="new-register-error-message">{errors.terms}</span>}
                  </div>

                  <button
                    type="submit"
                    className="new-register-submit-btn"
                    disabled={isLoading || socialLoading !== '' || !isFormValid()}
                  >
                    {isLoading ? 'Sending Code...' : 'Send Verification Code'}
                  </button>

                  <div className="new-register-social">
                    <p className="new-register-social-text">Or sign up with</p>
                    <div className="new-register-social-buttons">
                      <button
                        type="button"
                        className={`new-register-social-btn new-register-google-btn ${socialLoading === 'google' ? 'new-register-loading' : ''}`}
                        onClick={handleGoogleRegister}
                        disabled={isLoading || socialLoading !== ''}
                      >
                        {socialLoading === 'google' ? (
                          <span className="new-register-loading-spinner"></span>
                        ) : (
                          <FcGoogle className="new-register-google-icon" />
                        )}
                        <span className="new-register-google-text">Continue with Google</span>
                      </button>
                    </div>
                  </div>

                  <div className="new-register-login-prompt">
                    <p className="new-register-login-text">
                      Already have an account? <Link to="/login" className="new-register-login-link">Sign in</Link>
                    </p>
                  </div>
                </form>
              </>
            )}

            {/* ===== STEP 2: Verification Code - FORM ON LEFT ===== */}
            {currentStep === 2 && (
              <>
                <div className="new-register-form-header">
                  <h2 className="new-register-form-title">Verify Your Email</h2>
                  <p className="new-register-form-subtitle">
                    We've sent a 6-digit code to <strong>{formData.email}</strong>
                  </p>
                </div>

                {errors.code && (
                  <div className="new-register-general-error">
                    {errors.code}
                  </div>
                )}

                <form onSubmit={handleVerifyCode} className="new-register-form">
                  <div className="new-register-code-input-group">
                    <div className="new-register-code-inputs">
                      {code.map((digit, index) => (
                        <input
                          key={index}
                          id={`code-${index}`}
                          type="text"
                          maxLength="1"
                          className={`new-register-code-input ${errors.code ? 'new-register-input-error' : ''}`}
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
                    className="new-register-submit-btn"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Verifying...' : 'Verify Code'}
                  </button>

                  <div className="new-register-resend-code">
                    <p className="new-register-resend-text">
                      Didn't receive code?{' '}
                      <button
                        type="button"
                        className="new-register-resend-link"
                        onClick={handleResendCode}
                        disabled={isCooldownActive}
                      >
                        {isCooldownActive ? `Resend (${formatCooldown()})` : 'Resend'}
                      </button>
                    </p>
                  </div>

                  <button
                    type="button"
                    className="new-register-back-button"
                    onClick={() => setCurrentStep(1)}
                    disabled={isLoading}
                  >
                    <FaArrowLeft /> Back to Registration
                  </button>
                </form>
              </>
            )}

            {currentStep === 3 && (
              <div className="new-register-success-container">
                <div className="new-register-success-icon">✓</div>
                <h2 className="new-register-success-title">Successfully Registered!</h2>
                <p className="new-register-success-text">
                  Your account has been created successfully. You can now log in to access your solar projects.
                </p>
                <button
                  onClick={handleBackToLogin}
                  className="new-register-back-to-login-btn"
                >
                  Back to Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;