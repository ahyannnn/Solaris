// components/AppDownload.jsx - Android Green Theme with Phone Mockup
import React, { useState, useEffect } from 'react';
import { FaAndroid, FaDownload, FaSpinner, FaCheckCircle, FaGooglePlay } from 'react-icons/fa';
import axios from 'axios';

const AppDownload = () => {
  // ===== ALL HOOKS MUST BE AT THE TOP LEVEL =====
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isIconHovered, setIsIconHovered] = useState(false);
  const [isButtonHovered, setIsButtonHovered] = useState(false);
  const [isButtonActive, setIsButtonActive] = useState(false);

  useEffect(() => {
    fetchLatestApp();
  }, []);

  // Add keyframes
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
      }
      @keyframes ripple {
        to { transform: scale(4); opacity: 0; }
      }
      @keyframes pulse {
        0%, 100% { opacity: 0.3; }
        50% { opacity: 0.6; }
      }
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-6px); }
      }
      .phone-float {
        animation: float 3s ease-in-out infinite;
      }
      .glow-pulse {
        animation: pulse 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // ===== HOOKS END HERE =====

  const fetchLatestApp = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/applications/latest`
      );
      if (response.data.success && response.data.app) {
        setApp(response.data.app);
        setError(null);
      } else {
        setError('No application available');
        setApp(null);
      }
    } catch (error) {
      console.error('Error fetching latest app:', error);
      setError('Failed to load application');
      setApp(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (app && app.apkUrl) {
      window.open(app.apkUrl, '_blank');
    }
  };

  const handleRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.position = 'absolute';
    ripple.style.borderRadius = '50%';
    ripple.style.background = 'rgba(255, 255, 255, 0.2)';
    ripple.style.transform = 'scale(0)';
    ripple.style.animation = 'ripple 0.6s linear';
    ripple.style.pointerEvents = 'none';
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  // Android Green Theme Colors
  const colors = {
    androidGreen: '#3DDC84',
    androidGreenDark: '#2E8B57',
    androidGreenLight: '#66D98B',
    androidGreenGlow: 'rgba(61, 220, 132, 0.3)',
    androidGreenHover: '#2E7D32',
    darkBg: '#1A1A1A',
    cardBg: 'rgba(26, 26, 26, 0.85)',
    textWhite: '#FFFFFF',
    textGray: 'rgba(255, 255, 255, 0.7)',
    borderColor: 'rgba(61, 220, 132, 0.2)',
    borderHover: 'rgba(61, 220, 132, 0.4)',
  };

  const styles = {
    container: {
      display: 'flex',
      alignItems: 'center',
      gap: '40px',
      background: colors.cardBg,
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderRadius: '32px',
      padding: '32px 40px',
      border: '1px solid rgba(61, 220, 132, 0.15)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(61, 220, 132, 0.1)',
      maxWidth: '700px',
      width: '100%',
      transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden',
    },
    containerHover: {
      transform: 'translateY(-4px)',
      borderColor: colors.borderHover,
      boxShadow: '0 24px 80px rgba(61, 220, 132, 0.15), 0 0 60px rgba(61, 220, 132, 0.05)',
    },
    containerGlow: {
      position: 'absolute',
      top: '-50%',
      right: '-20%',
      width: '300px',
      height: '300px',
      background: 'radial-gradient(circle, rgba(61, 220, 132, 0.1) 0%, transparent 70%)',
      borderRadius: '50%',
      pointerEvents: 'none',
    },
    phoneMockup: {
      position: 'relative',
      width: '140px',
      height: '280px',
      flexShrink: 0,
    },
    phoneBody: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(145deg, #2A2A2A, #1A1A1A)',
      borderRadius: '28px',
      border: '2px solid rgba(61, 220, 132, 0.2)',
      padding: '10px',
      position: 'relative',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
    },
    phoneScreen: {
      width: '100%',
      height: '100%',
      background: 'linear-gradient(180deg, #0D0D0D 0%, #1A1A1A 100%)',
      borderRadius: '18px',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    },
    phoneNotch: {
      position: 'absolute',
      top: '6px',
      left: '50%',
      transform: 'translateX(-50%)',
      width: '40px',
      height: '4px',
      background: 'rgba(255,255,255,0.1)',
      borderRadius: '2px',
    },
    phoneAppIcon: {
      fontSize: '48px',
      color: colors.androidGreen,
      marginBottom: '8px',
      filter: 'drop-shadow(0 4px 20px rgba(61, 220, 132, 0.3))',
    },
    phoneAppName: {
      fontSize: '12px',
      fontWeight: '600',
      color: '#FFFFFF',
      textAlign: 'center',
      letterSpacing: '0.5px',
    },
    phoneAppSub: {
      fontSize: '9px',
      color: 'rgba(255,255,255,0.3)',
      textAlign: 'center',
      marginTop: '2px',
    },
    phoneStatusBar: {
      position: 'absolute',
      top: '8px',
      left: '18px',
      right: '18px',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '8px',
      color: 'rgba(255,255,255,0.3)',
    },
    phoneTime: {
      fontWeight: '600',
    },
    phoneBattery: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
    },
    phoneBatteryIcon: {
      width: '18px',
      height: '8px',
      border: '1px solid rgba(255,255,255,0.2)',
      borderRadius: '2px',
      position: 'relative',
      padding: '1px',
    },
    phoneBatteryFill: {
      height: '100%',
      width: '80%',
      background: colors.androidGreen,
      borderRadius: '1px',
    },
    content: {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      minWidth: '0',
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
    },
    androidIcon: {
      fontSize: '32px',
      color: colors.androidGreen,
      filter: 'drop-shadow(0 4px 12px rgba(61, 220, 132, 0.3))',
      transition: 'transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
    },
    androidIconHover: {
      transform: 'scale(1.1) rotate(10deg)',
    },
    titleGroup: {
      display: 'flex',
      flexDirection: 'column',
    },
    title: {
      fontSize: '22px',
      fontWeight: '700',
      color: colors.textWhite,
      margin: 0,
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: '13px',
      color: colors.textGray,
      margin: 0,
    },
    versionInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      flexWrap: 'wrap',
    },
    versionBadge: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '6px',
      padding: '4px 14px',
      background: 'rgba(61, 220, 132, 0.12)',
      color: colors.androidGreen,
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: '600',
      border: '1px solid rgba(61, 220, 132, 0.1)',
    },
    releaseNotes: {
      fontSize: '13px',
      color: colors.textGray,
      margin: 0,
      lineHeight: '1.5',
    },
    downloadButton: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '10px',
      padding: '14px 28px',
      background: `linear-gradient(135deg, ${colors.androidGreen}, ${colors.androidGreenDark})`,
      color: '#FFFFFF',
      border: 'none',
      borderRadius: '16px',
      fontSize: '15px',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow: `0 4px 20px ${colors.androidGreenGlow}`,
      width: '100%',
      marginTop: '4px',
      position: 'relative',
      overflow: 'hidden',
    },
    downloadButtonHover: {
      transform: 'translateY(-2px) scale(1.02)',
      boxShadow: `0 8px 32px ${colors.androidGreenGlow}`,
    },
    downloadButtonActive: {
      transform: 'scale(0.98)',
    },
    downloadButtonIcon: {
      fontSize: '18px',
    },
    checkIcon: {
      fontSize: '16px',
      color: colors.androidGreen,
    },
    loadingContainer: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
      color: colors.textGray,
      fontSize: '15px',
      padding: '40px',
    },
    spinner: {
      animation: 'spin 1s linear infinite',
      fontSize: '32px',
      color: colors.androidGreen,
    },
    trustBadges: {
      display: 'flex',
      gap: '16px',
      marginTop: '4px',
    },
    trustBadge: {
      display: 'flex',
      alignItems: 'center',
      gap: '4px',
      fontSize: '11px',
      color: 'rgba(255, 255, 255, 0.3)',
    },
    trustIcon: {
      fontSize: '12px',
      color: colors.androidGreen,
    },
  };

  // ===== LOADING STATE (AFTER ALL HOOKS) =====
  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingContainer}>
          <FaSpinner style={styles.spinner} />
          <span>Checking for updates...</span>
        </div>
      </div>
    );
  }

  // ===== ERROR/NO APP STATE =====
  if (error || !app) {
    return null;
  }

  // ===== RENDER =====
  return (
    <div 
      style={{
        ...styles.container,
        ...(isHovered ? styles.containerHover : {}),
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div style={styles.containerGlow} className="glow-pulse" />

      {/* Phone Mockup */}
      <div style={styles.phoneMockup} className="phone-float">
        <div style={styles.phoneBody}>
          <div style={styles.phoneScreen}>
            <div style={styles.phoneNotch} />
            <div style={styles.phoneStatusBar}>
              <span style={styles.phoneTime}>9:41</span>
              <div style={styles.phoneBattery}>
                <div style={styles.phoneBatteryIcon}>
                  <div style={styles.phoneBatteryFill} />
                </div>
              </div>
            </div>
            <FaAndroid style={styles.phoneAppIcon} />
            <div style={styles.phoneAppName}>Salfer Solar</div>
            <div style={styles.phoneAppSub}>v{app.version}</div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={styles.content}>
        <div style={styles.header}>
          <div 
            style={{
              ...styles.androidIcon,
              ...(isIconHovered ? styles.androidIconHover : {}),
            }}
            onMouseEnter={() => setIsIconHovered(true)}
            onMouseLeave={() => setIsIconHovered(false)}
          >
            <FaAndroid />
          </div>
          <div style={styles.titleGroup}>
            <h3 style={styles.title}>Salfer Solar App</h3>
            <p style={styles.subtitle}>Power Your Solar Journey</p>
          </div>
        </div>

        <div style={styles.versionInfo}>
          <span style={styles.versionBadge}>
            <FaCheckCircle style={styles.checkIcon} /> v{app.version}
          </span>
          {app.releaseNotes && (
            <p style={styles.releaseNotes}>{app.releaseNotes}</p>
          )}
        </div>

        <button 
          style={{
            ...styles.downloadButton,
            ...(isButtonHovered ? styles.downloadButtonHover : {}),
            ...(isButtonActive ? styles.downloadButtonActive : {}),
          }}
          onMouseEnter={() => setIsButtonHovered(true)}
          onMouseLeave={() => setIsButtonHovered(false)}
          onMouseDown={() => setIsButtonActive(true)}
          onMouseUp={() => setIsButtonActive(false)}
          onClick={(e) => {
            handleRipple(e);
            handleDownload();
          }}
        >
          <FaGooglePlay style={styles.downloadButtonIcon} /> Download APK
        </button>

        <div style={styles.trustBadges}>
          <span style={styles.trustBadge}>
            <FaCheckCircle style={styles.trustIcon} /> Secure
          </span>
          <span style={styles.trustBadge}>
            <FaCheckCircle style={styles.trustIcon} /> Verified
          </span>
          <span style={styles.trustBadge}>
            <FaCheckCircle style={styles.trustIcon} /> Latest Version
          </span>
        </div>
      </div>
    </div>
  );
};

export default AppDownload;