import React, { useState, useEffect } from 'react';
import '../components_styles/landingpage.css';

const SolarisLandingPage = () => {
  const [activeSection, setActiveSection] = useState('hero');

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle scroll to update active section
  useEffect(() => {
    const handleScroll = () => {
      const sections = ['hero', 'what', 'how', 'features', 'users', 'limitations'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 100 && rect.bottom >= 100;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="solaris-landing-page">
      {/* Header */}
      <header className="solaris-header">
        <div className="header-container">
          <div className="logo-container">
            <div className="logo-icon">
              <svg viewBox="0 0 24 24">
                <path d="M12 2L3 21H21L12 2ZM12 6L17 18H7L12 6Z" />
              </svg>
            </div>
            <h1 className="logo-text">SOLARIS</h1>
          </div>
          
          <nav className="main-nav">
            <button 
              className={`nav-btn ${activeSection === 'what' ? 'active' : ''}`}
              onClick={() => scrollToSection('what')}
            >
              What It Does
            </button>
            <button 
              className={`nav-btn ${activeSection === 'how' ? 'active' : ''}`}
              onClick={() => scrollToSection('how')}
            >
              How It Works
            </button>
            <button 
              className={`nav-btn ${activeSection === 'features' ? 'active' : ''}`}
              onClick={() => scrollToSection('features')}
            >
              Features
            </button>
            <button 
              className={`nav-btn ${activeSection === 'users' ? 'active' : ''}`}
              onClick={() => scrollToSection('users')}
            >
              Users
            </button>
            <button 
              className={`nav-btn ${activeSection === 'limitations' ? 'active' : ''}`}
              onClick={() => scrollToSection('limitations')}
            >
              Limitations
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h2 className="hero-title">IoT-Based Solar Site Pre-Assessment System</h2>
            <p className="hero-subtitle">
              Collect, transmit, and review environmental data for solar installation planning
            </p>
            <div className="hero-buttons">
              <button 
                className="btn-primary"
                onClick={() => scrollToSection('what')}
              >
                Learn How It Works
              </button>
              <button 
                className="btn-secondary"
                onClick={() => scrollToSection('limitations')}
              >
                View System Scope
              </button>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="device-container">
              <div className="iot-device">
                <div className="device-screen">
                  <div className="screen-header">
                    <span className="device-status">● Transmitting</span>
                  </div>
                  <div className="screen-data">
                    <div className="data-row">
                      <span className="data-label">Irradiance</span>
                      <span className="data-value">850 W/m²</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Temperature</span>
                      <span className="data-value">24°C</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Humidity</span>
                      <span className="data-value">45%</span>
                    </div>
                    <div className="data-row">
                      <span className="data-label">Battery</span>
                      <span className="data-value">92%</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="data-transmission">
                <div className="signal-dots">
                  <div className="signal-dot"></div>
                  <div className="signal-dot"></div>
                  <div className="signal-dot"></div>
                </div>
                <div className="signal-line"></div>
                <div className="cloud-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What It Does Section */}
      <section id="what" className="section what-section">
        <div className="section-container">
          <h2 className="section-title">What the System Does</h2>
          <p className="section-subtitle">Pre-installation environmental data collection for solar site assessment</p>
          
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
              </div>
              <h3>Environmental Data Collection</h3>
              <p>Uses an IoT device to collect site-specific data including solar irradiance, ambient temperature, and weather conditions during pre-installation inspections.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                </svg>
              </div>
              <h3>Temporary Site Deployment</h3>
              <p>Device is temporarily deployed only during the site inspection phase, prior to any solar panel installation, typically for 1-4 weeks.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z" />
                </svg>
              </div>
              <h3>Data Reference for Planning</h3>
              <p>Provides organized reference data to support engineers and project teams in manual solar system design and layout planning.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how" className="section how-section">
        <div className="section-container">
          <h2 className="section-title">How It Works</h2>
          <p className="section-subtitle">Three-phase process from data collection to platform access</p>
          
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                </svg>
              </div>
              <h3>Device Deployment</h3>
              <p>Temporary installation of IoT device at potential solar site for data collection period</p>
            </div>
            
            <div className="step-arrow">
              <svg viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </div>
            
            <div className="process-step">
              <div className="step-number">2</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
                </svg>
              </div>
              <h3>Data Transmission</h3>
              <p>Collected environmental data transmitted to secure web-based platform</p>
            </div>
            
            <div className="step-arrow">
              <svg viewBox="0 0 24 24">
                <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z" />
              </svg>
            </div>
            
            <div className="process-step">
              <div className="step-number">3</div>
              <div className="step-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
              </div>
              <h3>Platform Access</h3>
              <p>Authorized users view, store, and review assessment data through dashboards</p>
            </div>
          </div>
        </div>
      </section>

      {/* Key Features Section */}
      <section id="features" className="section features-section">
        <div className="section-container">
          <h2 className="section-title">Key Features</h2>
          <p className="section-subtitle">Core functionality of the SOLARIS system</p>
          
          <div className="features-list">
            <div className="feature-item">
              <div className="feature-item-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z" />
                </svg>
              </div>
              <div>
                <h3>Data Dashboards</h3>
                <p>Visual presentation of collected environmental metrics with clear charts and historical data views.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-item-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <div>
                <h3>Role-Based Access</h3>
                <p>Secure authentication system providing different access levels for engineers, project managers, and inspectors.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-item-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M17 3H7c-1.1 0-1.99.9-1.99 2L5 21l7-3 7 3V5c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <div>
                <h3>Structured Data Storage</h3>
                <p>Organized database for all site assessment records with metadata, timestamps, and location data.</p>
              </div>
            </div>
            
            <div className="feature-item">
              <div className="feature-item-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z" />
                </svg>
              </div>
              <div>
                <h3>Site Comparison Tools</h3>
                <p>Compare environmental data across multiple potential installation sites for better decision making.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Intended Users Section */}
      <section id="users" className="section users-section">
        <div className="section-container">
          <h2 className="section-title">Intended Users</h2>
          <p className="section-subtitle">Professional roles supported by the SOLARIS system</p>
          
          <div className="users-grid">
            <div className="user-card">
              <div className="user-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
              </div>
              <h3>Solar Engineers</h3>
              <p>Use collected environmental data as reference for manual system design and component selection.</p>
            </div>
            
            <div className="user-card">
              <div className="user-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
                </svg>
              </div>
              <h3>Project Teams</h3>
              <p>Review site assessment data during planning and feasibility stages of solar projects.</p>
            </div>
            
            <div className="user-card">
              <div className="user-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z" />
                </svg>
              </div>
              <h3>Site Inspectors</h3>
              <p>Deploy and manage IoT devices during on-site assessments and data collection periods.</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Limitations Section */}
      <section id="limitations" className="section limitations-section">
        <div className="section-container">
          <h2 className="section-title">System Limitations</h2>
          <p className="section-subtitle">Clear scope boundaries of the SOLARIS system</p>
          
          <div className="limitations-list">
            <div className="limitation-card">
              <div className="limitation-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
                </svg>
              </div>
              <div>
                <h3>Not a Monitoring System</h3>
                <p>SOLARIS is not a real-time monitoring system for installed solar panels. It is used exclusively during pre-installation site assessment.</p>
              </div>
            </div>
            
            <div className="limitation-card">
              <div className="limitation-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M16.59 7.58L10 14.17l-3.59-3.58L5 12l5 5 8-8zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z" />
                </svg>
              </div>
              <div>
                <h3>No Automated Analysis</h3>
                <p>The system does not perform automated analysis, optimization, forecasting, or decision-making. It provides raw and organized data for human review.</p>
              </div>
            </div>
            
            <div className="limitation-card">
              <div className="limitation-icon">
                <svg viewBox="0 0 24 24">
                  <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z" />
                </svg>
              </div>
              <div>
                <h3>No Design Recommendations</h3>
                <p>SOLARIS does not generate design recommendations, financial evaluations, or system layouts. It serves as a data reference tool for manual planning.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="solaris-footer">
        <div className="footer-container">
          <div className="footer-content">
            <div className="footer-logo">
              <div className="logo-container">
                <div className="logo-icon">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 2L3 21H21L12 2ZM12 6L17 18H7L12 6Z" />
                  </svg>
                </div>
                <h3 className="logo-text">SOLARIS</h3>
              </div>
              <p className="footer-tagline">IoT-Based Solar Site Pre-Assessment System</p>
            </div>
            
            <div className="footer-info">
              <p>Academic Prototype System | Capstone Project</p>
              <p className="footer-note">Focus: IoT data collection and review for solar site assessment</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default SolarisLandingPage;