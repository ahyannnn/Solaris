import React, { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import "../../styles/Auth/landingpage.css";
import { 
  FaSolarPanel, 
  FaSun, 
  FaTemperatureHigh, 
  FaTint, 
  FaWind,
  FaArrowRight,
  FaCheckCircle,
  FaBolt,
  FaHome,
  FaCoins,
  FaLeaf,
  FaClock,
  FaMapMarkerAlt,
  FaUserTie,
  FaHardHat,
  FaMobileAlt,
  FaLaptop,
  FaChartLine,
  FaFileInvoiceDollar,
  FaProjectDiagram,
  FaClipboardList,
  FaMicrochip,
  FaWifi,
  FaServer,
  FaUsers,
  FaCog,
  FaHeadset
} from 'react-icons/fa';

const LandingPage = () => {
  const navigate = useNavigate();
  const [activeSection, setActiveSection] = useState("home");
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }

      const sections = ['hero', 'how', 'features', 'users', 'contact'];
      const current = sections.find(section => {
        const element = document.getElementById(section);
        if (element) {
          const rect = element.getBoundingClientRect();
          return rect.top <= 150 && rect.bottom >= 150;
        }
        return false;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId);
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleLoginClick = () => navigate('/login');
  const handleRegisterClick = () => navigate('/register');

  return (
    <div className="landing-page">
      {/* Sticky Header */}
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="header-container">
            <div className="logo">
              <div className="logo-icon">
                <FaSolarPanel />
              </div>
              <span className="logo-text">SOLARIS</span>
            </div>
            
            <nav className="nav-menu">
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
                For Whom
              </button>
              <button 
                className={`nav-btn ${activeSection === 'contact' ? 'active' : ''}`}
                onClick={() => scrollToSection('contact')}
              >
                Contact
              </button>
            </nav>

            <div className="auth-buttons">
              <button className="btn-login" onClick={handleLoginClick}>Log in</button>
              <button className="btn-register" onClick={handleRegisterClick}>Sign up</button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="hero-section">
        <div className="container">
          <div className="hero-grid">
            <div className="hero-content">
              <h1 className="hero-title">
                Smart Solar Assessment.<br />
                <span className="highlight">Before You Install.</span>
              </h1>
              <p className="hero-subtitle">
                SOLARIS helps solar companies and homeowners assess site conditions 
                before installation — using IoT sensors, web & mobile apps.
              </p>
              
              <div className="hero-features">
                <div className="feature-item">
                  <FaCheckCircle className="feature-icon" />
                  <span>IoT-powered data</span>
                </div>
                <div className="feature-item">
                  <FaCheckCircle className="feature-icon" />
                  <span>Web + Mobile app</span>
                </div>
                <div className="feature-item">
                  <FaCheckCircle className="feature-icon" />
                  <span>7-day assessment</span>
                </div>
              </div>

              <button className="btn-primary" onClick={handleRegisterClick}>
                Get Started
              </button>

              <p className="hero-note">
                Already have an account? <button onClick={handleLoginClick} className="text-link">Sign in</button>
              </p>
            </div>

            <div className="hero-stats">
              <div className="stat-card">
                <FaSun className="stat-icon" />
                <div>
                  <div className="stat-value">Solar Irradiance</div>
                  <div className="stat-label">Measures sunlight intensity</div>
                </div>
              </div>
              <div className="stat-card">
                <FaTemperatureHigh className="stat-icon" />
                <div>
                  <div className="stat-value">Temperature</div>
                  <div className="stat-label">Ambient & panel heat</div>
                </div>
              </div>
              <div className="stat-card">
                <FaTint className="stat-icon" />
                <div>
                  <div className="stat-value">Humidity</div>
                  <div className="stat-label">Weather conditions</div>
                </div>
              </div>
              <div className="stat-card">
                <FaWind className="stat-icon" />
                <div>
                  <div className="stat-value">Wind Speed</div>
                  <div className="stat-label">Site ventilation</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="how-section">
        <div className="container">
          <h2 className="section-title">How SOLARIS Works</h2>
          <p className="section-subtitle">A simple 3-step process for accurate site assessment</p>

          <div className="steps-grid">
            <div className="step-card">
              <div className="step-number">1</div>
              <FaMapMarkerAlt className="step-icon" />
              <h3>Deploy IoT Device</h3>
              <p>We install a solar-powered sensor at your site for 7 days. It measures irradiance, temperature, humidity, and location.</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <FaWifi className="step-icon" />
              <h3>Data Transmission</h3>
              <p>Every 2 hours, data is sent to the cloud. If offline, it's stored locally and uploaded when reconnected.</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <FaLaptop className="step-icon" />
              <h3>View & Analyze</h3>
              <p>Engineers and clients access reports via web or mobile app — ready for system design and quotation.</p>
            </div>
          </div>

          <div className="how-note">
            <FaClock className="note-icon" />
            <p>Assessment takes 7 days. No interference with your daily operations.</p>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="features-section">
        <div className="container">
          <h2 className="section-title">Platform Features</h2>
          <p className="section-subtitle">Web + Mobile — built for solar professionals and clients</p>

          <div className="features-grid">
            <div className="feature-card">
              <FaClipboardList className="feature-main-icon" />
              <h3>Site Assessment Module</h3>
              <p>Create, monitor, and manage site assessments. View IoT data like irradiance, temperature, and humidity in real time.</p>
            </div>
            <div className="feature-card">
              <FaProjectDiagram className="feature-main-icon" />
              <h3>Project Management</h3>
              <p>Track installation progress, assign engineers, and update clients — all in one place.</p>
            </div>
            <div className="feature-card">
              <FaFileInvoiceDollar className="feature-main-icon" />
              <h3>Billing & Quotations</h3>
              <p>Generate quotes, accept GCash payments, upload receipts, and track invoices.</p>
            </div>
            <div className="feature-card">
              <FaMicrochip className="feature-main-icon" />
              <h3>IoT Device Module</h3>
              <p>Monitor real-time sensor data: solar irradiance, panel temp, voltage, and energy output.</p>
            </div>
            <div className="feature-card">
              <FaChartLine className="feature-main-icon" />
              <h3>Reports Module</h3>
              <p>Generate PDF, Excel, or Word reports for assessments, projects, and billing.</p>
            </div>
            <div className="feature-card">
              <FaUsers className="feature-main-icon" />
              <h3>User Management</h3>
              <p>Role-based access for Admins, Engineers, and Customers — secure and organized.</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Whom */}
      <section id="users" className="users-section">
        <div className="container">
          <h2 className="section-title">Who Is SOLARIS For?</h2>
          <p className="section-subtitle">Designed for three types of users</p>

          <div className="users-grid">
            <div className="user-card">
              <div className="user-icon"><FaUserTie /></div>
              <h3>Solar Engineers</h3>
              <p>Conduct site assessments, upload photos, prepare quotations, and access IoT data for accurate reporting.</p>
            </div>
            <div className="user-card">
              <div className="user-icon"><FaHardHat /></div>
              <h3>Project Managers</h3>
              <p>Assign engineers, monitor progress, track billing, and oversee multiple projects.</p>
            </div>
            <div className="user-card">
              <div className="user-icon"><FaHome /></div>
              <h3>Homeowners / Clients</h3>
              <p>View project status, accept quotations, pay online via GCash, and track installation progress.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-card">
            <h2>Ready to assess your site?</h2>
            <p>Get accurate data before installation — no guesswork, no delays.</p>
            <button className="btn-primary btn-large" onClick={handleRegisterClick}>
              Request Assessment
            </button>
            <p className="cta-note">Free consultation • 7-day assessment • Web + mobile access</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-brand">
              <div className="footer-logo">
                <FaSolarPanel />
                <span>SOLARIS</span>
              </div>
              <p>An IoT-based solar site pre-assessment system for accurate installation planning.</p>
              <p className="footer-address">📍 Purok 2, Masaya, San Jose, Camarines Sur</p>
              <p className="footer-phone">📞 0951-907-9171</p>
              <p className="footer-email">✉️ salfer.engineering@gmail.com</p>
            </div>
            <div className="footer-links">
              <h4>Quick Links</h4>
              <a href="#" onClick={() => scrollToSection('how')}>How It Works</a>
              <a href="#" onClick={() => scrollToSection('features')}>Features</a>
              <a href="#" onClick={() => scrollToSection('users')}>For Whom</a>
              <a href="#" onClick={() => scrollToSection('contact')}>Contact</a>
            </div>
            <div className="footer-links">
              <h4>Legal</h4>
              <a href="#">Terms & Conditions</a>
              <a href="#">Privacy Policy</a>
              <a href="#">Refund Policy</a>
            </div>
            <div className="footer-links">
              <h4>Partner</h4>
              <p className="partner-name">Lightup SOLAR by Salfer Engineering</p>
              <p className="partner-desc">DTI & BIR registered since 2017</p>
            </div>
          </div>
          <div className="footer-bottom">
            <p>© 2025 SOLARIS. All rights reserved. | BSIT 32A | Teope, Christiniel R.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;