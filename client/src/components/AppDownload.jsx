// components/AppDownload.jsx - 3-phone hero for the landing page download section.
// Screenshots live in client/public (first / middle / third.jpg).
import React, { useState, useEffect, useCallback } from 'react';
import { FaGooglePlay, FaCheckCircle, FaSpinner, FaTimes, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import axios from 'axios';
import '../styles/Auth/appDownload.css';

// Order matches the file names: first / middle / third, with the middle
// screenshot promoted to the centre hero position. All three are 1080 x ~2185.
const SCREENS = [
  { pos: 'left', src: '/first.jpg', alt: 'Solaris app dashboard showing project, quote, payment and assessment counts', caption: 'Dashboard' },
  { pos: 'center', src: '/middle.jpg', alt: 'Solaris app welcome screen for Salfer Engineering', caption: 'Welcome' },
  { pos: 'right', src: '/third.jpg', alt: 'Solaris app cash payment confirmation with receipt details', caption: 'Payment' }
];

const AppDownload = () => {
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [failedShots, setFailedShots] = useState({});
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    fetchLatestApp();
  }, []);

  // Lock background scroll while the lightbox is open
  useEffect(() => {
    if (lightbox === null) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [lightbox]);

  const fetchLatestApp = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/applications/latest`);
      if (response.data.success && response.data.app) {
        setApp(response.data.app);
        setError(null);
      } else {
        setError('No application available');
        setApp(null);
      }
    } catch (err) {
      console.error('Error fetching latest app:', err);
      setError('Failed to load application');
      setApp(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (app && app.apkUrl) {
      window.open(app.apkUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const handleRipple = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const ripple = document.createElement('span');
    ripple.className = 'adl-ripple';
    ripple.style.width = `${size}px`;
    ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  };

  const handleShotError = (pos) => {
    setFailedShots((prev) => ({ ...prev, [pos]: true }));
  };

  const stepLightbox = useCallback((dir) => {
    setLightbox((cur) => (cur === null ? cur : (cur + dir + SCREENS.length) % SCREENS.length));
  }, []);

  // ESC closes, arrow keys move between screens
  useEffect(() => {
    if (lightbox === null) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setLightbox(null);
      else if (e.key === 'ArrowRight') stepLightbox(1);
      else if (e.key === 'ArrowLeft') stepLightbox(-1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [lightbox, stepLightbox]);

  if (loading) {
    return (
      <div className="adl-wrap">
        <div className="adl-stage" aria-hidden="true">
          <div className="adl-phone adl-phone--center">
            <div className="adl-bezel">
              <div className="adl-screen">
                <div className="adl-skeleton" />
              </div>
            </div>
          </div>
        </div>
        <div className="adl-loading">
          <FaSpinner className="adl-spin" />
          <span>Checking for updates...</span>
        </div>
      </div>
    );
  }

  if (error || !app) {
    return null;
  }

  const active = lightbox === null ? null : SCREENS[lightbox];

  return (
    <div className="adl-wrap">
      <div className="adl-stage">
        {SCREENS.map((screen, i) => (
          <button
            key={screen.pos}
            type="button"
            className={`adl-phone adl-phone--${screen.pos}`}
            onClick={() => setLightbox(i)}
            aria-label={`View larger: ${screen.caption} screen`}
          >
            <span className="adl-bezel">
              <span className="adl-screen">
                {failedShots[screen.pos] ? (
                  <span className="adl-fallback">
                    <img src="/Salfare_Logo.png" alt="" className="adl-fallback-logo" />
                    <span className="adl-fallback-name">Salfer Solar</span>
                    <span className="adl-fallback-sub">v{app.version}</span>
                  </span>
                ) : (
                  <img
                    src={screen.src}
                    alt={screen.alt}
                    className="adl-shot"
                    loading="lazy"
                    decoding="async"
                    onError={() => handleShotError(screen.pos)}
                  />
                )}
                <span className="adl-zoom" aria-hidden="true" />
              </span>
            </span>
          </button>
        ))}
      </div>

      <div className="adl-cta">
        <span className="adl-version">
          <FaCheckCircle /> v{app.version}
        </span>

        {app.releaseNotes && <p className="adl-release">{app.releaseNotes}</p>}

        <button
          className="adl-btn"
          onClick={(e) => {
            handleRipple(e);
            handleDownload();
          }}
        >
          <FaGooglePlay /> Download APK
        </button>

        <div className="adl-trust">
          <span className="adl-trust-item"><FaCheckCircle /> Secure</span>
          <span className="adl-trust-item"><FaCheckCircle /> Verified</span>
          <span className="adl-trust-item"><FaCheckCircle /> Latest Version</span>
        </div>
      </div>

      {active && (
        <div
          className="adl-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${active.caption} screen preview`}
          onClick={() => setLightbox(null)}
        >
          <button
            type="button"
            className="adl-lb-close"
            onClick={() => setLightbox(null)}
            aria-label="Close preview"
          >
            <FaTimes />
          </button>

          <button
            type="button"
            className="adl-lb-nav adl-lb-prev"
            onClick={(e) => { e.stopPropagation(); stepLightbox(-1); }}
            aria-label="Previous screen"
          >
            <FaChevronLeft />
          </button>

          <figure className="adl-lb-figure" onClick={(e) => e.stopPropagation()}>
            <img className="adl-lb-img" src={active.src} alt={active.alt} />
            <figcaption className="adl-lb-caption">
              <span className="adl-lb-title">{active.caption}</span>
              <span className="adl-lb-count">
                {lightbox + 1} of {SCREENS.length}
              </span>
            </figcaption>
          </figure>

          <button
            type="button"
            className="adl-lb-nav adl-lb-next"
            onClick={(e) => { e.stopPropagation(); stepLightbox(1); }}
            aria-label="Next screen"
          >
            <FaChevronRight />
          </button>
        </div>
      )}
    </div>
  );
};

export default AppDownload;
