// pages/Auth/landingpage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FaUsers, 
  FaClipboardList, 
  FaStar, 
  FaMoneyBillWave,
  FaTools,
  FaSolarPanel,
  FaChartLine,
  FaCheckCircle,
  FaArrowRight,
  FaDownload,
  FaCalculator,
  FaCalendarAlt
} from 'react-icons/fa';
import TermsModal from '../../assets/termsandconditions';
import logo from '../../assets/Salfare_Logo.png';
import "../../styles/Auth/landingpage.css";

const LandingPage = () => {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [showEstimateModal, setShowEstimateModal] = useState(false);
  const [monthlyBill, setMonthlyBill] = useState('');
  const [estimateResult, setEstimateResult] = useState(null);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Advanced Estimator State
  const [advancedEstimatorData, setAdvancedEstimatorData] = useState({
    monthlyBill: '',
    electricityRate: '11.50',
    averageSunHours: '5',
    systemType: 'grid-tie',
    usagePattern: 'daytime'
  });
  const [advancedEstimationResult, setAdvancedEstimationResult] = useState(null);
  const [calculating, setCalculating] = useState(false);

  const images = {
    hero: "https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80",
    about: "https://cjnsolar.com.au/wp-content/uploads/2024/02/Solar-panel-installation-process-1.jpg",
    services: "https://www.naturalgen.co.uk/template/images/Client/NG-SolarPanelInstall-3.jpg"
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = ['hero', 'about', 'mission-vision', 'free-vs-paid', 'solar-estimator', 'how-it-works', 'services', 'why-us'];
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

  const calculateAdvancedSavings = () => {
    setCalculating(true);

    setTimeout(() => {
      const monthlyBill = parseFloat(advancedEstimatorData.monthlyBill) || 0;
      const rate = parseFloat(advancedEstimatorData.electricityRate) || 11.50;
      const sunHours = parseFloat(advancedEstimatorData.averageSunHours) || 5;
      const systemType = advancedEstimatorData.systemType;
      const usagePattern = advancedEstimatorData.usagePattern;

      const monthlyConsumption = monthlyBill / rate;
      const dailyConsumption = monthlyConsumption / 30;

      let recommendedSize = dailyConsumption / sunHours;
      recommendedSize = Math.ceil(recommendedSize * 2) / 2;

      let selfConsumptionRatio = usagePattern === 'daytime' ? 0.8 : 0.4;
      let exportRatio = usagePattern === 'daytime' ? 0.2 : 0.6;

      let systemCostPerKw = 0;
      let batteryCost = 0;
      let systemEfficiency = 0;
      let systemDescription = '';

      switch (systemType) {
        case 'grid-tie':
          systemCostPerKw = 70000;
          batteryCost = 0;
          systemEfficiency = 0.85;
          systemDescription = 'Grid-tied (No battery)';
          break;
        case 'hybrid':
          systemCostPerKw = 75000;
          batteryCost = 120000;
          systemEfficiency = 0.9;
          systemDescription = 'Hybrid (With battery)';
          break;
        case 'off-grid':
          systemCostPerKw = 80000;
          batteryCost = 200000;
          systemEfficiency = 0.8;
          systemDescription = 'Off-grid (Independent)';
          break;
        default:
          systemCostPerKw = 70000;
          batteryCost = 0;
          systemEfficiency = 0.85;
      }

      const systemCost = recommendedSize * systemCostPerKw;
      const totalSystemCost = systemCost + batteryCost;

      const dailyProduction = recommendedSize * sunHours * systemEfficiency;
      const monthlyProduction = dailyProduction * 30;

      const selfConsumedEnergy = monthlyProduction * selfConsumptionRatio;
      const selfConsumptionSavings = selfConsumedEnergy * rate;

      const exportRate = systemType === 'grid-tie' ? rate * 0.7 : 0;
      const exportedEnergy = monthlyProduction * exportRatio;
      const exportSavings = exportedEnergy * exportRate;

      const estimatedMonthlySavings = selfConsumptionSavings + exportSavings;
      const gridDependency = Math.max(0, ((monthlyConsumption - monthlyProduction) / monthlyConsumption * 100)).toFixed(1);

      const annualSavings = estimatedMonthlySavings * 12;
      const paybackPeriod = totalSystemCost / annualSavings;

      const co2PerKwh = 0.7;
      const annualProduction = monthlyProduction * 12;
      const co2OffsetPerYear = Math.round(annualProduction * co2PerKwh);

      let cumulativeSavings = 0;
      for (let year = 1; year <= 25; year++) {
        cumulativeSavings += annualSavings * Math.pow(1.03, year - 1);
      }
      const total25YearSavingsWithInflation = Math.round(cumulativeSavings);

      const panelsNeeded = Math.ceil(recommendedSize * 1000 / 400);
      const roofSpaceNeeded = panelsNeeded * 2;

      setAdvancedEstimationResult({
        recommendedSize,
        panelsNeeded,
        roofSpaceNeeded,
        estimatedMonthlySavings: Math.round(estimatedMonthlySavings),
        monthlyProduction: Math.round(monthlyProduction),
        monthlyConsumption: Math.round(monthlyConsumption),
        selfConsumptionRatio: selfConsumptionRatio * 100,
        exportRatio: exportRatio * 100,
        gridDependency,
        systemCost: Math.round(totalSystemCost),
        paybackPeriod: Math.round(paybackPeriod * 10) / 10,
        co2OffsetPerYear,
        total25YearSavings: total25YearSavingsWithInflation,
        systemDescription,
        systemType,
        dailyProduction: Math.round(dailyProduction * 10) / 10,
        annualSavings: Math.round(annualSavings)
      });

      setCalculating(false);
    }, 500);
  };

  const handleAdvancedEstimatorChange = (e) => {
    const { name, value } = e.target;
    setAdvancedEstimatorData(prev => ({ ...prev, [name]: value }));
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-PH').format(value);
  };

  const closeModal = () => {
    setShowEstimateModal(false);
    setMonthlyBill('');
    setEstimateResult(null);
  };

  return (
    <div className="landing-page-land">
      {/* Sticky Header */}
      <header className={`site-header-land ${scrolled ? 'scrolled-land' : ''}`}>
        <div className="container-land">
          <div className="header-content-land">
            <div className="logo-land" onClick={() => scrollToSection('hero')}>
              <img src={logo} alt="Salfer Engineering" className="logo-img-land" />
              <div className="logo-text-land">
                <span className="logo-name-land">Salfer Engineering</span>
                <span className="logo-tagline-land">Solar Technology Enterprise</span>
              </div>
            </div>

            <nav className="desktop-nav-land">
              <button className={`nav-link-land ${activeSection === 'about' ? 'active-land' : ''}`} onClick={() => scrollToSection('about')}>About</button>
              <button className={`nav-link-land ${activeSection === 'free-vs-paid' ? 'active-land' : ''}`} onClick={() => scrollToSection('free-vs-paid')}>Services</button>
              <button className={`nav-link-land ${activeSection === 'how-it-works' ? 'active-land' : ''}`} onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              <button className={`nav-link-land ${activeSection === 'solar-estimator' ? 'active-land' : ''}`} onClick={() => scrollToSection('solar-estimator')}>Estimator</button>
              <button className={`nav-link-land ${activeSection === 'why-us' ? 'active-land' : ''}`} onClick={() => scrollToSection('why-us')}>Why Us</button>
            </nav>

            <div className="header-actions-land">
              <button className="btn-login-land" onClick={handleLogin}>Sign In</button>
              <button className="btn-signup-land" onClick={handleSignup}>Sign Up</button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="hero-section-land" style={{
        backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${images.hero})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}>
        <div className="container-land">
          <div className="hero-content-land">
            <h1 className="hero-title-land">Lower Your Electricity Bills with Solar Energy</h1>
            <p className="hero-subtitle-land">We design, install, and assess solar systems to help you save more and use energy efficiently.</p>
            <div className="hero-buttons-land">
              <button className="btn-primary-land" onClick={() => scrollToSection('solar-estimator')}>Get Free Solar Estimate</button>
              <button className="btn-outline-land light-land" onClick={() => scrollToSection('free-vs-paid')}>Request a Quote</button>
            </div>
          </div>
        </div>
      </section>

      {/* About Us Section */}
      <section id="about" className="about-section-land">
        <div className="container-land">
          <div className="about-grid-land">
            <div className="about-content-land">
              <h2 className="section-title-land">About the Company</h2>
              <p>Salfer Engineering & Solar Technology Enterprise is a solar service provider established in 2017. The company offers solar system design, installation, and technical services for residential and commercial clients.</p>
              <p>With years of experience in engineering and project management, the company focuses on delivering reliable and cost-effective solar solutions tailored to each client's needs.</p>
              <div className="stats-mini-land">
                <div className="stat-mini-land"><span className="stat-number-land">2017</span><span className="stat-label-land">Established</span></div>
                <div className="stat-mini-land"><span className="stat-number-land">500+</span><span className="stat-label-land">Projects</span></div>
                <div className="stat-mini-land"><span className="stat-number-land">100%</span><span className="stat-label-land">Satisfaction</span></div>
              </div>
            </div>
            <div className="about-image-land"><img src={images.about} alt="Solar panels on residential roof" /></div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section id="mission-vision" className="mission-vision-section-land">
        <div className="container-land">
          <div className="mission-vision-grid-land">
            <div className="mission-card-land"><h3>Our Mission</h3><p>To provide reliable, efficient, and cost-effective solar energy solutions that help clients reduce electricity costs while promoting sustainable energy use.</p></div>
            <div className="vision-card-land"><h3>Our Vision</h3><p>To become a trusted provider of solar energy solutions in the Philippines by delivering quality service, continuous innovation, and long-term customer satisfaction.</p></div>
          </div>
        </div>
      </section>

      {/* Free vs Paid Section */}
      <section id="free-vs-paid" className="comparison-section-land">
        <div className="container-land">
          <h2 className="section-title-land">Start Free, Upgrade Anytime</h2>
          <p className="section-subtitle-land">Choose what works best for you</p>
          <div className="comparison-grid-land">
            <div className="comparison-card-land free-land">
              <div className="card-badge-land">Free</div>
              <h3>Free Solar Estimate</h3>
              <ul className="feature-list-land"><li>Based on your monthly electricity bill</li><li>Quick and easy computation</li><li>Provides an initial estimate of savings</li><li>Includes system size and payback period</li></ul>
              <p className="card-note-land">Perfect for getting started.</p>
              <button className="btn-outline-land" onClick={() => scrollToSection('solar-estimator')}>Get Free Estimate</button>
            </div>
            <div className="comparison-card-land paid-land">
              <div className="card-badge-land paid-land">Paid Assessment</div>
              <h3>Advanced Site Assessment</h3>
              <ul className="feature-list-land"><li>On-site visit with monitoring device</li><li>Collects actual environmental data</li><li>Improves accuracy of system planning</li><li>Includes detailed report</li><li>7-day IoT device monitoring</li></ul>
              <p className="card-note-land">Best for accurate results and serious planning.</p>
              <button className="btn-primary-land" onClick={handleSignup}>Sign Up to Book</button>
            </div>
          </div>
        </div>
      </section>

      {/* Solar Savings Estimator Section */}
      <section id="solar-estimator" className="estimator-section-land">
        <div className="container-land">
          <h2 className="section-title-land">Solar Savings Estimator</h2>
          <p className="section-subtitle-land">Get a personalized estimate of your potential savings</p>
          <div className="estimator-card-land">
            <div className="estimator-inputs-land">
              <div className="input-group-land"><label>Monthly Electricity Bill (₱)</label><input type="number" name="monthlyBill" value={advancedEstimatorData.monthlyBill} onChange={handleAdvancedEstimatorChange} placeholder="e.g., 5000" /></div>
              <div className="input-group-land"><label>Electricity Rate (₱/kWh)</label><input type="number" name="electricityRate" value={advancedEstimatorData.electricityRate} onChange={handleAdvancedEstimatorChange} placeholder="e.g., 11.50" step="0.1" /><small>Meralco avg: ₱11.50/kWh</small></div>
              <div className="input-group-land"><label>Average Sun Hours</label><input type="number" name="averageSunHours" value={advancedEstimatorData.averageSunHours} onChange={handleAdvancedEstimatorChange} placeholder="e.g., 5" step="0.5" /><small>PH average: 5-6 hours</small></div>
              <div className="input-group-land"><label>System Type</label><select name="systemType" value={advancedEstimatorData.systemType} onChange={handleAdvancedEstimatorChange}><option value="grid-tie">Grid-tie (No battery)</option><option value="hybrid">Hybrid (With battery backup)</option><option value="off-grid">Off-grid (Complete independence)</option></select></div>
              <div className="input-group-land"><label>Usage Pattern</label><select name="usagePattern" value={advancedEstimatorData.usagePattern} onChange={handleAdvancedEstimatorChange}><option value="daytime">Mostly Daytime</option><option value="nighttime">Mostly Nighttime</option><option value="mixed">Mixed (balanced usage)</option></select></div>
              <button onClick={calculateAdvancedSavings} disabled={!advancedEstimatorData.monthlyBill || calculating} className="btn-calculate-land">{calculating ? 'Calculating...' : 'Calculate Savings'}</button>
            </div>
            {advancedEstimationResult && (
              <div className="estimator-results-land">
                <h3>Your Personalized Solar Estimate</h3>
                <div className="results-grid-land">
                  <div className="result-item-land"><span className="result-label-land">Recommended System</span><strong>{advancedEstimationResult.recommendedSize} kW</strong><small>{advancedEstimationResult.systemDescription}</small></div>
                  <div className="result-item-land highlight-land"><span className="result-label-land">Monthly Savings</span><strong>{formatCurrency(advancedEstimationResult.estimatedMonthlySavings)}</strong></div>
                  <div className="result-item-land"><span className="result-label-land">System Cost</span><strong>{formatCurrency(advancedEstimationResult.systemCost)}</strong><small>{advancedEstimationResult.panelsNeeded} panels • {advancedEstimationResult.roofSpaceNeeded} sqm</small></div>
                  <div className="result-item-land"><span className="result-label-land">Grid Dependency</span><strong>{advancedEstimationResult.gridDependency}%</strong></div>
                  <div className="result-item-land"><span className="result-label-land">Payback Period</span><strong>{advancedEstimationResult.paybackPeriod} years</strong></div>
                  <div className="result-item-land"><span className="result-label-land">CO₂ Offset/Year</span><strong>{formatNumber(advancedEstimationResult.co2OffsetPerYear)} kg</strong></div>
                  <div className="result-item-land full-width-land"><span className="result-label-land">25-Year Savings</span><strong>{formatCurrency(advancedEstimationResult.total25YearSavings)}</strong><small>With inflation adjustment</small></div>
                </div>
                <p className="estimator-note-land">*This is a preliminary estimate. Actual savings may vary based on site conditions.<button className="text-link-land" onClick={() => scrollToSection('free-vs-paid')}>Book a detailed site assessment for accurate results.</button></p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="howitworks-section-land">
        <div className="container-land">
          <h2 className="section-title-land">How It Works</h2>
          <div className="howitworks-steps-land">
            <div className="howitworks-step-land"><div className="step-circle-land">1</div><h3>Request a Free Estimate</h3></div>
            <div className="howitworks-step-land"><div className="step-circle-land">2</div><h3>Review Your Initial Results</h3></div>
            <div className="howitworks-step-land"><div className="step-circle-land">3</div><h3>Book a Site Assessment</h3></div>
            <div className="howitworks-step-land"><div className="step-circle-land">4</div><h3>Receive Your Solar Plan</h3></div>
            <div className="howitworks-step-land"><div className="step-circle-land">5</div><h3>Installation & Completion</h3></div>
          </div>
        </div>
      </section>

      {/* Services Section - Image on left, bullet list on right with equal height */}
      <section id="services" className="services-section-land">
        <div className="container-land">
          <div className="services-grid-land">
            <div className="services-image-land">
              <img src={images.services} alt="Solar installation" />
            </div>
            <div className="services-content-land">
              <h2 className="section-title-land">Our Services</h2>
              <ul className="services-list-land">
                <li>Solar System Design & Engineering</li>
                <li>Professional Site Assessment</li>
                <li>Complete Solar Installation</li>
                <li>Project Monitoring & Management</li>
                <li>Maintenance & Technical Support</li>
                <li>7-Day IoT Data Collection</li>
                <li>Detailed Performance Reports</li>
                <li>Free Solar Savings Estimator</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section - 4 Cards Only */}
      <section id="why-us" className="whyus-section-land">
        <div className="container-land">
          <h2 className="section-title-land">Why Choose Us</h2>
          <div className="whyus-grid-land">
            <div className="whyus-card-land">
              <FaUsers className="whyus-icon-land" />
              <h3>Experienced Engineering Team</h3>
              <p>Years of expertise in solar technology</p>
            </div>
            <div className="whyus-card-land">
              <FaClipboardList className="whyus-icon-land" />
              <h3>Organized Workflow</h3>
              <p>Efficient processes from start to finish</p>
            </div>
            <div className="whyus-card-land">
              <FaStar className="whyus-icon-land" />
              <h3>Reliable Service</h3>
              <p>Trusted by hundreds of satisfied clients</p>
            </div>
            <div className="whyus-card-land">
              <FaTools className="whyus-icon-land" />
              <h3>Post-Installation Support</h3>
              <p>Ongoing maintenance and assistance</p>
            </div>
          </div>
        </div>
      </section>

      {/* Simple Estimate Modal */}
      {showEstimateModal && (
        <div className="modal-overlay-land" onClick={closeModal}>
          <div className="modal-content-land" onClick={e => e.stopPropagation()}>
            <button className="modal-close-land" onClick={closeModal}>×</button>
            <h2>Free Solar Estimate</h2>
            <p>Enter your average monthly electricity bill</p>
            <div className="estimate-form-land">
              <div className="input-group-land"><span className="currency-land">₱</span><input type="number" value={monthlyBill} onChange={(e) => setMonthlyBill(e.target.value)} placeholder="e.g., 5000" /></div>
              <button className="btn-primary-land" onClick={() => { const bill = parseFloat(monthlyBill) || 0; const estimatedSavings = Math.round(bill * 0.3); const estimatedSystemSize = Math.round((bill / 11.5 / 30) * 1.2); setEstimateResult({ monthlySavings: estimatedSavings, systemSize: estimatedSystemSize, paybackYears: (estimatedSystemSize * 70000 / (estimatedSavings * 12)).toFixed(1) }); }} disabled={!monthlyBill}>Calculate</button>
            </div>
            {estimateResult && (
              <div className="estimate-result-land">
                <h3>Your Estimated Savings</h3>
                <div className="result-item-simple-land"><span>Monthly Savings:</span><strong>₱{estimateResult.monthlySavings.toLocaleString()}</strong></div>
                <div className="result-item-simple-land"><span>Recommended System Size:</span><strong>{estimateResult.systemSize} kW</strong></div>
                <div className="result-item-simple-land"><span>Estimated Payback:</span><strong>{estimateResult.paybackYears} years</strong></div>
                <p className="result-note-land">*This is a rough estimate. Book a site assessment for accurate results.</p>
                <button className="btn-primary-land" onClick={() => { closeModal(); scrollToSection('free-vs-paid'); }}>Learn About Paid Assessment</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Terms and Conditions Modal */}
      <TermsModal isOpen={showTermsModal} onClose={() => setShowTermsModal(false)} mode="simple" title="Terms and Conditions" />

      {/* Footer */}
      <footer className="footer-land">
        <div className="container-land">
          <div className="footer-grid-land">
            <div className="footer-info-land">
              <div className="footer-logo-land"><img src={logo} alt="Salfer Engineering" /><div><h3>Salfer Engineering</h3><p>Solar Technology Enterprise</p></div></div>
              <p>DTI & BIR Registered since 2017</p><p>Purok 2, Masaya, San Jose, Camarines Sur</p><p>0951-907-9171</p><p>salfer.engineering@gmail.com</p>
            </div>
            <div className="footer-links-land">
              <h4>Quick Links</h4>
              <button onClick={() => scrollToSection('about')}>About</button>
              <button onClick={() => scrollToSection('services')}>Services</button>
              <button onClick={() => scrollToSection('how-it-works')}>How It Works</button>
              <button onClick={() => scrollToSection('why-us')}>Why Us</button>
              <button onClick={() => scrollToSection('solar-estimator')}>Estimator</button>
            </div>
            <div className="footer-links-land">
              <h4>Legal</h4>
              <button onClick={() => setShowTermsModal(true)}>Terms & Conditions</button>
              <button onClick={() => alert('Privacy Policy - Coming Soon')}>Privacy Policy</button>
            </div>
            <div className="footer-cta-land">
              <h4>Ready to save?</h4>
              <button className="btn-primary-land" onClick={() => scrollToSection('solar-estimator')}>Get Free Estimate</button>
              <div className="social-links-land">
                <a href="#" target="_blank" rel="noopener noreferrer">Facebook</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom-land"><p>© 2025 Salfer Engineering & Solar Technology Enterprise. All rights reserved.</p></div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;