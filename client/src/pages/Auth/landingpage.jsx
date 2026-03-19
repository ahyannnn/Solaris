import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaSun, 
  FaBolt, 
  FaLeaf, 
  FaHome, 
  FaBuilding,
  FaClipboardCheck,
  FaCalendarAlt,
  FaChartLine,
  FaCheckCircle,
  FaArrowRight,
  FaArrowDown,
  FaMapMarkerAlt,
  FaClock,
  FaFileInvoice,
  FaUsers,
  FaRuler,
  FaTools,
  FaHeadset,
  FaTimes,
  FaStar,
  FaBullseye,
  FaGlobe,
  FaHandshake
} from 'react-icons/fa';
import logo from '../../assets/Salfare_Logo.png';
import "../../styles/Auth/landingpage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [monthlyBill, setMonthlyBill] = useState('');
  const [estimateResult, setEstimateResult] = useState(null);

  // Real background images from Unsplash
  const images = {
    hero: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    about: "https://cjnsolar.com.au/wp-content/uploads/2024/02/Solar-panel-installation-process-1.jpg",
    assessment: "https://www.naturalgen.co.uk/template/images/Client/NG-SolarPanelInstall-3.jpg",
    installation: "https://www.naturalgen.co.uk/template/images/Client/NG-SolarPanelInstall-3.jpg",
    commercial: "https://www.naturalgen.co.uk/template/images/Client/NG-SolarPanelInstall-3.jpg"
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      
      const sections = ['hero', 'about', 'mission-vision', 'free-vs-paid', 'problem', 'solution', 'assessment', 'how-it-works', 'services', 'savings', 'why-us'];
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

  const handleLogin = () => navigate('/login');
  const handleSignup = () => navigate('/register');

  const calculateEstimate = () => {
    const bill = parseFloat(monthlyBill) || 0;
    const estimatedSavings = Math.round(bill * 0.3);
    const estimatedSystemSize = Math.round((bill / 11.5 / 30) * 1.2);
    
    setEstimateResult({
      monthlySavings: estimatedSavings,
      systemSize: estimatedSystemSize,
      paybackYears: (estimatedSystemSize * 70000 / (estimatedSavings * 12)).toFixed(1)
    });
  };

  const closeModal = () => {
    setShowEstimateModal(false);
    setMonthlyBill('');
    setEstimateResult(null);
  };

  return (
    <div className="landing-page">
      {/* Sticky Header */}
      <header className={`site-header ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          <div className="header-content">
            <div className="logo" onClick={() => scrollToSection('hero')}>
              <img src={logo} alt="Salfer Engineering" className="logo-img" />
              <div className="logo-text">
                <span className="logo-name">Salfer Engineering</span>
                <span className="logo-tagline">Solar Technology Enterprise</span>
              </div>
            </div>

            <nav className="desktop-nav">
              <button 
                className={`nav-link ${activeSection === 'about' ? 'active' : ''}`}
                onClick={() => scrollToSection('about')}
              >
                About
              </button>
              <button 
                className={`nav-link ${activeSection === 'free-vs-paid' ? 'active' : ''}`}
                onClick={() => scrollToSection('free-vs-paid')}
              >
                Services
              </button>
              <button 
                className={`nav-link ${activeSection === 'how-it-works' ? 'active' : ''}`}
                onClick={() => scrollToSection('how-it-works')}
              >
                How It Works
              </button>
              <button 
                className={`nav-link ${activeSection === 'savings' ? 'active' : ''}`}
                onClick={() => scrollToSection('savings')}
              >
                Savings
              </button>
              <button 
                className={`nav-link ${activeSection === 'why-us' ? 'active' : ''}`}
                onClick={() => scrollToSection('why-us')}
              >
                Why Us
              </button>
            </nav>

            <div className="header-actions">
              <button className="btn-login" onClick={handleLogin}>Sign In</button>
              <button className="btn-signup" onClick={handleSignup}>Sign Up</button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="hero-section" style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${images.hero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">Lower Your Electricity Bills with Solar Energy</h1>
            <p className="hero-subtitle">
              We design, install, and assess solar systems to help you save more and use energy efficiently.
            </p>
            <div className="hero-buttons">
              <button 
                className="btn-primary"
                onClick={() => setShowEstimateModal(true)}
              >
                Get Free Solar Estimate
              </button>
              <button 
                className="btn-outline light"
                onClick={() => scrollToSection('free-vs-paid')}
              >
                Request a Quote
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <h2 className="section-title">About the Company</h2>
              <p>
                Salfer Engineering & Solar Technology Enterprise is a solar service provider established in 2017. 
                The company offers solar system design, installation, and technical services for residential and commercial clients.
              </p>
              <p>
                With years of experience in engineering and project management, the company focuses on delivering reliable 
                and cost-effective solar solutions tailored to each client's needs.
              </p>
              <div className="stats-mini">
                <div className="stat-mini">
                  <span className="stat-number">2017</span>
                  <span className="stat-label">Established</span>
                </div>
                <div className="stat-mini">
                  <span className="stat-number">500+</span>
                  <span className="stat-label">Projects</span>
                </div>
                <div className="stat-mini">
                  <span className="stat-number">100%</span>
                  <span className="stat-label">Satisfaction</span>
                </div>
              </div>
            </div>
            <div className="about-image">
              <img src={images.about} alt="Solar panels on residential roof" />
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission-vision" className="mission-vision-section">
        <div className="container">
          <div className="mission-vision-grid">
            <div className="mission-card">
              <FaBullseye className="mission-icon" />
              <h3>Our Mission</h3>
              <p>
                To provide reliable, efficient, and cost-effective solar energy solutions that help clients 
                reduce electricity costs while promoting sustainable energy use.
              </p>
            </div>
            <div className="vision-card">
              <FaGlobe className="vision-icon" />
              <h3>Our Vision</h3>
              <p>
                To become a trusted provider of solar energy solutions in the Philippines by delivering 
                quality service, continuous innovation, and long-term customer satisfaction.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Free vs Paid Section */}
      <section id="free-vs-paid" className="comparison-section">
        <div className="container">
          <h2 className="section-title">Start Free, Upgrade Anytime</h2>
          <p className="section-subtitle">Choose what works best for you</p>

          <div className="comparison-grid">
            <div className="comparison-card free">
              <div className="card-badge">Free</div>
              <h3>Free Solar Estimate</h3>
              <ul className="feature-list">
                <li><FaCheckCircle /> Based on your monthly electricity bill</li>
                <li><FaCheckCircle /> Quick and easy computation</li>
                <li><FaCheckCircle /> Provides an initial estimate of savings</li>
              </ul>
              <p className="card-note">Perfect for getting started.</p>
              <button 
                className="btn-outline"
                onClick={() => setShowEstimateModal(true)}
              >
                Get Free Estimate
              </button>
            </div>

            <div className="comparison-card paid">
              <div className="card-badge paid">Paid Assessment</div>
              <h3>Advanced Site Assessment</h3>
              <ul className="feature-list">
                <li><FaCheckCircle /> On-site visit with monitoring device</li>
                <li><FaCheckCircle /> Collects actual environmental data</li>
                <li><FaCheckCircle /> Improves accuracy of system planning</li>
                <li><FaCheckCircle /> Includes detailed report</li>
              </ul>
              <p className="card-note">Best for accurate results and serious planning.</p>
              <button className="btn-primary">Learn More</button>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="problem-section">
        <div className="container">
          <h2 className="section-title">Why Consider Solar?</h2>
          <div className="problem-grid">
            <div className="problem-card">
              <FaBolt className="problem-icon" />
              <h3>Rising electricity costs</h3>
              <p>Electricity rates continue to increase every year</p>
            </div>
            <div className="problem-card">
              <FaChartLine className="problem-icon" />
              <h3>Lack of clear information</h3>
              <p>Hard to know actual savings without proper data</p>
            </div>
            <div className="problem-card">
              <FaHome className="problem-icon" />
              <h3>Uncertainty in system choice</h3>
              <p>Every home has different energy needs</p>
            </div>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="solution-section">
        <div className="container">
          <h2 className="section-title">Our Approach</h2>
          <div className="solution-steps">
            <div className="solution-step">
              <div className="step-number">1</div>
              <h3>Evaluate your energy usage</h3>
            </div>
            <FaArrowRight className="step-arrow" />
            <div className="solution-step">
              <div className="step-number">2</div>
              <h3>Provide an initial estimate</h3>
            </div>
            <FaArrowRight className="step-arrow" />
            <div className="solution-step">
              <div className="step-number">3</div>
              <h3>Conduct detailed site assessment if needed</h3>
            </div>
            <FaArrowRight className="step-arrow" />
            <div className="solution-step">
              <div className="step-number">4</div>
              <h3>Design and install your system properly</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Assessment Section */}
      <section id="assessment" className="assessment-section">
        <div className="container">
          <div className="assessment-grid">
            <div className="assessment-content">
              <h2 className="section-title">Accurate Site Assessment</h2>
              <ul className="assessment-list">
                <li><FaCheckCircle /> A device is installed at your location</li>
                <li><FaCheckCircle /> Records sunlight and environmental conditions</li>
                <li><FaCheckCircle /> Helps improve system planning accuracy</li>
                <li><FaCheckCircle /> Data is organized for easy understanding</li>
              </ul>
            </div>
            <div className="assessment-image">
              <img src={images.assessment} alt="Site assessment device" />
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section - 5 steps in one row */}
      <section id="how-it-works" className="howitworks-section">
        <div className="container">
          <h2 className="section-title">How It Works</h2>
          <div className="howitworks-steps">
            <div className="howitworks-step">
              <div className="step-circle">1</div>
              <h3>Request a Free Estimate</h3>
            </div>
            
            <div className="howitworks-step">
              <div className="step-circle">2</div>
              <h3>Review Your Initial Results</h3>
            </div>
            
            <div className="howitworks-step">
              <div className="step-circle">3</div>
              <h3>Book a Site Assessment</h3>
            </div>
            
            <div className="howitworks-step">
              <div className="step-circle">4</div>
              <h3>Receive Your Solar Plan</h3>
            </div>
            
            <div className="howitworks-step">
              <div className="step-circle">5</div>
              <h3>Installation & Completion</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="services-section">
        <div className="container">
          <h2 className="section-title">Our Services</h2>
          <div className="services-grid">
            <div className="service-card">
              <FaSun className="service-icon" />
              <h3>Solar System Design</h3>
            </div>
            <div className="service-card">
              <FaClipboardCheck className="service-icon" />
              <h3>Site Assessment</h3>
            </div>
            <div className="service-card">
              <FaTools className="service-icon" />
              <h3>Solar Installation</h3>
            </div>
            <div className="service-card">
              <FaChartLine className="service-icon" />
              <h3>Project Monitoring</h3>
            </div>
            <div className="service-card">
              <FaHeadset className="service-icon" />
              <h3>Maintenance Support</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Savings Section */}
      <section id="savings" className="savings-section">
        <div className="container">
          <h2 className="section-title">Benefits of Solar</h2>
          <div className="savings-grid">
            <div className="savings-card">
              <FaBolt className="savings-icon" />
              <h3>Lower electricity bills</h3>
              <p>Reduce your monthly power costs significantly</p>
            </div>
            <div className="savings-card">
              <FaLeaf className="savings-icon" />
              <h3>Long-term savings</h3>
              <p>Invest once, save for decades</p>
            </div>
            <div className="savings-card">
              <FaHome className="savings-icon" />
              <h3>Increased property value</h3>
              <p>Homes with solar sell for more</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section id="why-us" className="whyus-section">
        <div className="container">
          <h2 className="section-title">Why Choose Us</h2>
          <div className="whyus-grid">
            <div className="whyus-card">
              <FaUsers className="whyus-icon" />
              <h3>Experienced engineering team</h3>
            </div>
            <div className="whyus-card">
              <FaClipboardCheck className="whyus-icon" />
              <h3>Organized workflow</h3>
            </div>
            <div className="whyus-card">
              <FaHandshake className="whyus-icon" />
              <h3>Transparent process</h3>
            </div>
            <div className="whyus-card">
              <FaStar className="whyus-icon" />
              <h3>Reliable service</h3>
            </div>
          </div>
        </div>
      </section>

      {/* Estimate Modal */}
      {showEstimateModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={closeModal}>
              <FaTimes />
            </button>
            
            <h2>Free Solar Estimate</h2>
            <p>Enter your average monthly electricity bill</p>
            
            <div className="estimate-form">
              <div className="input-group">
                <span className="currency">₱</span>
                <input
                  type="number"
                  value={monthlyBill}
                  onChange={(e) => setMonthlyBill(e.target.value)}
                  placeholder="e.g., 5000"
                />
              </div>

              <button 
                className="btn-primary"
                onClick={calculateEstimate}
                disabled={!monthlyBill}
              >
                Calculate
              </button>
            </div>

            {estimateResult && (
              <div className="estimate-result">
                <h3>Your Estimated Savings</h3>
                <div className="result-item">
                  <span>Monthly Savings:</span>
                  <strong>₱{estimateResult.monthlySavings.toLocaleString()}</strong>
                </div>
                <div className="result-item">
                  <span>Recommended System Size:</span>
                  <strong>{estimateResult.systemSize} kW</strong>
                </div>
                <div className="result-item">
                  <span>Estimated Payback:</span>
                  <strong>{estimateResult.paybackYears} years</strong>
                </div>
                <p className="result-note">
                  *This is a rough estimate. Book a site assessment for accurate results.
                </p>
                <button 
                  className="btn-primary"
                  onClick={() => {
                    closeModal();
                    scrollToSection('free-vs-paid');
                  }}
                >
                  Learn About Paid Assessment
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-grid">
            <div className="footer-info">
              <div className="footer-logo">
                <img src={logo} alt="Salfer Engineering" />
                <div>
                  <h3>Salfer Engineering</h3>
                  <p>Solar Technology Enterprise</p>
                </div>
              </div>
              <p>DTI & BIR Registered since 2017</p>
              <p><FaMapMarkerAlt /> Purok 2, Masaya, San Jose, Camarines Sur</p>
              <p><FaClock /> 0951-907-9171</p>
              <p><FaFileInvoice /> salfer.engineering@gmail.com</p>
            </div>

            <div className="footer-links">
              <h4>Quick Links</h4>
              <button onClick={() => scrollToSection('about')}>About</button>
              <button onClick={() => scrollToSection('services')}>Services</button>
              <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              <button onClick={() => scrollToSection('why-us')}>Why Us</button>
            </div>

            <div className="footer-links">
              <h4>Legal</h4>
              <a href="/terms">Terms & Conditions</a>
              <a href="/privacy">Privacy Policy</a>
            </div>

            <div className="footer-cta">
              <h4>Ready to save?</h4>
              <button 
                className="btn-primary"
                onClick={() => setShowEstimateModal(true)}
              >
                Get Free Estimate
              </button>
              <div className="social-links">
                <a href="#"><FaUsers /> Facebook</a>
                <a href="#"><FaBuilding /> Instagram</a>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>© 2025 Salfer Engineering & Solar Technology Enterprise. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;