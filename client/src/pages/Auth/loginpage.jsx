import React, { useState } from 'react';
import { FaSolarPanel, FaEnvelope, FaLock, FaEye, FaEyeSlash, FaGoogle, FaFacebook } from 'react-icons/fa';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider, facebookProvider } from "../../firebase";
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
  const [socialLoading, setSocialLoading] = useState(''); // 'google', 'facebook', or ''

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
    }
    else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    return newErrors;
  };

  // LOGIN SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);
    setErrors({});

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || data.error || "Login failed" });
      } else {
        localStorage.setItem("token", data.token);
        localStorage.setItem("userName", data.user.fullName);
        localStorage.setItem("userEmail", data.user.email);
        localStorage.setItem("userRole", data.user.role);
        if (data.user.photoURL) {
          localStorage.setItem("userPhotoURL", data.user.photoURL);
        } else {
          localStorage.removeItem("userPhotoURL");
        }

        navigate("/dashboard");
      }
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ general: "Server error. Please try again later." });
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // GOOGLE LOGIN
  const handleGoogleLogin = async () => {
    try {
      setSocialLoading('google');

      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          fullName: user.displayName,
          email: user.email,
          googleId: user.uid,
          photoURL: user.photoURL
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setErrors({ general: data.message || "Google login failed" });
        return;
      }

      localStorage.setItem("token", data.token);
      localStorage.setItem("userName", data.user.fullName);
      localStorage.setItem("userEmail", data.user.email);
      localStorage.setItem("userRole", data.user.role);

      if (data.user.photoURL) {
        localStorage.setItem("userPhotoURL", data.user.photoURL);
      } else {
        localStorage.removeItem("userPhotoURL");
      }

      navigate("/dashboard");

    } catch (error) {
      console.error("Google login error:", error);

      if (error.code === 'auth/popup-closed-by-user') {
        setErrors({ general: 'Login popup was closed. Please try again.' });
      } else {
        setErrors({ general: 'Failed to login with Google. Please try again.' });
      }

    } finally {
      setSocialLoading('');
    }
  };

  

  return (
    <div className="login-page">
      <div className="login-card">
        {/* LEFT SIDE - Branding */}
        <div className="login-branding">
          <div className="branding-content">
            <div className="brand-logo">
              <FaSolarPanel className="brand-icon" />
              <h1 className="brand-name">SOLARIS</h1>
            </div>
            <h2 className="brand-tagline">
              IoT-Based Solar Site Pre-Assessment System
            </h2>
            <p className="brand-description">
              Collect, transmit, and review environmental data for solar installation planning
            </p>
          </div>
        </div>

        {/* RIGHT SIDE - Login Form */}
        <div className="login-form-container">
          <div className="login-form-wrapper">
            <div className="form-header">
              <h2 className="form-title">Welcome Back</h2>
              <p className="form-subtitle">
                Please enter your details to sign in
              </p>
            </div>

            {/* General Error Message */}
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

            <form onSubmit={handleSubmit} className="login-form">
              {/* EMAIL FIELD */}
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
                    disabled={isLoading || socialLoading !== ''}
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              {/* PASSWORD FIELD */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-wrapper">
                  <FaLock className="input-icon" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`form-input ${errors.password ? 'input-error' : ''}`}
                    placeholder="Enter your password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading || socialLoading !== ''}
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={togglePasswordVisibility}
                    disabled={isLoading || socialLoading !== ''}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
                
                {/* FORGOT PASSWORD LINK - Right Aligned */}
                <div className="forgot-password-container">
                  <Link to="/forgotpassword" className="forgot-link">
                    Forgot password?
                  </Link>
                </div>
                
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              {/* LOGIN BUTTON */}
              <button
                type="submit"
                className={`login-submit-btn ${isLoading ? 'loading' : ''}`}
                disabled={isLoading || socialLoading !== ''}
              >
                {isLoading ? 'Signing in...' : 'Sign In'}
              </button>

              {/* SOCIAL LOGIN */}
              <div className="social-login">
                <p className="social-login-text">Or continue with</p>
                <div className="social-buttons">
                  <button
                    type="button"
                    className={`social-btn google ${socialLoading === 'google' ? 'loading' : ''}`}
                    onClick={handleGoogleLogin}
                    disabled={isLoading || socialLoading !== ''}
                  >
                    {socialLoading === 'google' ? (
                      <span className="loading-spinner">⏳</span>
                    ) : (
                      <FaGoogle />
                    )}
                  </button>

                  
                </div>
              </div>

              {/* SIGN UP LINK */}
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