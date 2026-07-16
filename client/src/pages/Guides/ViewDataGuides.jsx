// pages/Guides/ViewDataGuide.jsx
// Updated: How Solar Panels Save You Money - Simple Explanation for Customerss

import React, { useState, useEffect, useRef } from 'react';
import {
  FaSun,
  FaMoneyBillWave,
  FaChartLine,
  FaHome,
  FaPlug,
  FaBolt,
  FaLeaf,
  FaChevronDown,
  FaChevronUp,
  FaArrowDown,
  FaStar,
  FaClock,
  FaCheckCircle,
  FaCalculator,
  FaLightbulb,
  FaHandHoldingUsd,
  FaUserGraduate
} from 'react-icons/fa';
import '../../styles/Guides/ViewDataGuide.css';

const ViewDataGuide = () => {
  const [activeSection, setActiveSection] = useState(null);
  const [isVisible, setIsVisible] = useState({});
  const [isScrolled, setIsScrolled] = useState(false);
  const sectionRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible((prev) => ({ ...prev, [entry.target.id]: true }));
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      observer.disconnect();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const toggleSection = (section) => {
    if (activeSection === section) {
      setActiveSection(null);
    } else {
      setActiveSection(section);
    }
  };

  const sections = [
    { id: 'how', title: 'How Solar Panels Work', icon: FaSun },
    { id: 'save', title: 'How You Save Money', icon: FaMoneyBillWave },
    { id: 'calculate', title: 'Sample Calculation', icon: FaCalculator },
    { id: 'benefits', title: 'Other Benefits of Solar', icon: FaLeaf },
    { id: 'ready', title: 'Is Solar Right for You?', icon: FaLightbulb },
  ];

  return (
    <div className="view-guide-page">
      {/* Premium Hero Section */}
      <section className="view-hero">
        <div className="view-hero-overlay"></div>
        <div className="view-hero-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="view-hero-content">
          <h1 className="view-hero-title">
            How Solar Panels<br />
            <span className="highlight-text">Save You Money</span>
          </h1>
          <p className="view-hero-subtitle">
            A simple explanation of how solar energy can reduce your electricity bills
          </p>
          <div className="scroll-indicator">
            <span>Scroll to learn more</span>
            <FaArrowDown className="scroll-arrow" />
          </div>
        </div>
      </section>

      {/* Sections */}
      {sections.map((section, index) => {
        const SectionIcon = section.icon;
        const isEven = index % 2 === 0;
        return (
          <section
            key={section.id}
            id={section.id}
            ref={(el) => (sectionRefs.current[section.id] = el)}
            className={`view-section ${isEven ? 'section-light' : 'section-dark'} ${isVisible[section.id] ? 'visible' : ''}`}
          >
            <div className="section-container">
              <div className="section-header">
                <div className="section-number">0{index + 1}</div>
                <div className="section-title-group">
                  <SectionIcon className="section-icon" />
                  <h2 className="section-title">{section.title}</h2>
                </div>
                <button
                  className="section-toggle-btn"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={activeSection === section.id}
                >
                  {activeSection === section.id ? <FaChevronUp /> : <FaChevronDown />}
                </button>
              </div>
              <div className={`section-body ${activeSection === section.id ? 'expanded' : ''}`}>
                {section.id === 'how' && (
                  <div className="how-content">
                    <p className="how-intro">
                      Solar panels turn sunlight into electricity that you can use in your home. 
                      Here's how it works in simple terms:
                    </p>
                    <div className="how-grid">
                      <div className="how-card">
                        <div className="how-card-icon">
                          <FaSun />
                        </div>
                        <h4>1. Sunlight Hits the Panels</h4>
                        <p>Solar panels are installed on your roof where they can catch the most sunlight. The panels are made of special materials that absorb the sun's energy.</p>
                      </div>
                      <div className="how-card">
                        <div className="how-card-icon">
                          <FaBolt />
                        </div>
                        <h4>2. Sunlight Becomes Electricity</h4>
                        <p>When sunlight hits the panels, it creates electricity. This is called direct current (DC) electricity. Think of it as raw power that needs to be converted.</p>
                      </div>
                      <div className="how-card">
                        <div className="how-card-icon">
                          <FaPlug />
                        </div>
                        <h4>3. Electricity Goes to Your Home</h4>
                        <p>The electricity goes through a device called an inverter that converts it to the type of electricity your home uses (AC). This power runs your lights, appliances, and electronics.</p>
                      </div>
                      <div className="how-card">
                        <div className="how-card-icon">
                          <FaChartLine />
                        </div>
                        <h4>4. Extra Power Goes to the Grid</h4>
                        <p>If your panels make more electricity than you need, the extra power goes back to the electric grid. You get credits from your electric company for this!</p>
                      </div>
                    </div>
                    <div className="how-note">
                      <FaCheckCircle className="how-note-icon" />
                      <p><strong>Bottom line:</strong> Your solar panels produce free electricity from the sun, reducing how much you need to buy from your electric company.</p>
                    </div>
                  </div>
                )}

                {section.id === 'save' && (
                  <div className="save-content">
                    <p className="save-intro">
                      Here are the main ways solar panels help you save money:
                    </p>
                    <div className="save-grid">
                      <div className="save-card">
                        <div className="save-card-icon">
                          <FaMoneyBillWave />
                        </div>
                        <h4>Lower Monthly Bills</h4>
                        <p>Your solar panels generate free electricity during the day. This means you buy less electricity from your electric company, so your monthly bill goes down.</p>
                        <div className="save-example">
                          <span>Example:</span> ₱5,000 bill → ₱2,000 bill (₱3,000 savings/month)
                        </div>
                      </div>
                      <div className="save-card">
                        <div className="save-card-icon">
                          <FaClock />
                        </div>
                        <h4>Long-Term Savings</h4>
                        <p>Solar panels typically last 25-30 years. The money you save on electricity over that time far exceeds the cost of the panels themselves.</p>
                        <div className="save-example">
                          <span>Example:</span> ₱3,000/month savings × 12 months = ₱36,000/year × 25 years = ₱900,000
                        </div>
                      </div>
                      <div className="save-card">
                        <div className="save-card-icon">
                          <FaHandHoldingUsd />
                        </div>
                        <h4>Protection from Rate Increases</h4>
                        <p>Electricity prices go up over time. With solar panels, you lock in your electricity cost and protect yourself from future rate hikes.</p>
                        <div className="save-example">
                          <span>Example:</span> Electricity rates go up 5% per year. Your solar savings grow even bigger over time.
                        </div>
                      </div>
                      <div className="save-card">
                        <div className="save-card-icon">
                          <FaHome />
                        </div>
                        <h4>Increased Property Value</h4>
                        <p>Homes with solar panels sell for more money. Buyers are willing to pay extra for a home with lower electricity costs.</p>
                        <div className="save-example">
                          <span>Example:</span> Homes with solar panels sell for 4-5% more than similar homes without them.
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {section.id === 'calculate' && (
                  <div className="calculate-content">
                    <p className="calculate-intro">
                      Here's a simple example to show how much you could save:
                    </p>
                    <div className="calculate-example">
                      <div className="calculate-bill">
                        <h4>Your Monthly Electric Bill</h4>
                        <div className="calculate-amount">₱5,000</div>
                        <p>This is how much you pay your electric company each month</p>
                      </div>
                      <div className="calculate-arrow-down">
                        <FaArrowDown />
                      </div>
                      <div className="calculate-solar">
                        <h4>After Solar Panels</h4>
                        <div className="calculate-amount calculate-savings">₱2,000</div>
                        <p>Your new monthly electric bill with solar panels</p>
                      </div>
                      <div className="calculate-arrow-down">
                        <FaArrowDown />
                      </div>
                      <div className="calculate-savings-box">
                        <h4>Your Monthly Savings</h4>
                        <div className="calculate-amount calculate-total">₱3,000</div>
                        <p>This is how much you keep in your pocket every month</p>
                      </div>
                    </div>

                    <div className="calculate-years">
                      <h4>What It Looks Like Over Time</h4>
                      <div className="calculate-timeline">
                        <div className="calculate-year">
                          <span className="year-label">Year 1</span>
                          <span className="year-savings">₱36,000 saved</span>
                        </div>
                        <div className="calculate-year">
                          <span className="year-label">Year 5</span>
                          <span className="year-savings">₱180,000 saved</span>
                        </div>
                        <div className="calculate-year highlight-year">
                          <span className="year-label">Year 10</span>
                          <span className="year-savings">₱360,000 saved</span>
                        </div>
                        <div className="calculate-year">
                          <span className="year-label">Year 20</span>
                          <span className="year-savings">₱720,000 saved</span>
                        </div>
                        <div className="calculate-year">
                          <span className="year-label">Year 25</span>
                          <span className="year-savings">₱900,000 saved</span>
                        </div>
                      </div>
                      <p className="calculate-note">
                        * This is a sample calculation. Your actual savings depend on your electricity usage, sunlight hours, and system size.
                      </p>
                    </div>
                  </div>
                )}

                {section.id === 'benefits' && (
                  <div className="benefits-content">
                    <p className="benefits-intro">
                      Saving money is great, but there are other awesome reasons to go solar:
                    </p>
                    <div className="benefits-grid">
                      <div className="benefit-card">
                        <div className="benefit-card-icon">
                          <FaLeaf />
                        </div>
                        <h4>Good for the Environment</h4>
                        <p>Solar energy is clean and renewable. It doesn't produce pollution or greenhouse gases. By going solar, you're helping protect the planet for future generations.</p>
                      </div>
                      <div className="benefit-card">
                        <div className="benefit-card-icon">
                          <FaBolt />
                        </div>
                        <h4>Energy Independence</h4>
                        <p>You're not relying as much on the electric grid or foreign energy sources. You produce your own electricity right from your roof.</p>
                      </div>
                      <div className="benefit-card">
                        <div className="benefit-card-icon">
                          <FaClock />
                        </div>
                        <h4>Low Maintenance</h4>
                        <p>Solar panels have no moving parts, so they're very reliable. They just need occasional cleaning to keep working efficiently for decades.</p>
                      </div>
                      <div className="benefit-card">
                        <div className="benefit-card-icon">
                          <FaUserGraduate />
                        </div>
                        <h4>Be a Role Model</h4>
                        <p>By going solar, you inspire your neighbors and community to consider renewable energy. You become part of the solution for a cleaner future.</p>
                      </div>
                    </div>
                  </div>
                )}

                {section.id === 'ready' && (
                  <div className="ready-content">
                    <p className="ready-intro">
                      Not sure if solar is right for you? Here's what to consider:
                    </p>
                    <div className="ready-grid">
                      <div className="ready-card">
                        <div className="ready-card-check">
                          <FaCheckCircle className="ready-check-icon" />
                        </div>
                        <h4>Your Roof Gets Good Sunlight</h4>
                        <p>Does your roof get direct sunlight for most of the day? South-facing roofs are best, but east and west also work.</p>
                      </div>
                      <div className="ready-card">
                        <div className="ready-card-check">
                          <FaCheckCircle className="ready-check-icon" />
                        </div>
                        <h4>Your Electric Bill is High</h4>
                        <p>If you're paying ₱3,000 or more per month, solar panels can make a big difference in your savings.</p>
                      </div>
                      <div className="ready-card">
                        <div className="ready-card-check">
                          <FaCheckCircle className="ready-check-icon" />
                        </div>
                        <h4>You Plan to Stay in Your Home</h4>
                        <p>Solar panels are a long-term investment. If you plan to stay in your home for 5+ years, the savings are worth it.</p>
                      </div>
                      <div className="ready-card">
                        <div className="ready-card-check">
                          <FaCheckCircle className="ready-check-icon" />
                        </div>
                        <h4>You Want to Save Money</h4>
                        
                        <p>If you want to reduce your monthly expenses and invest in a sustainable future, solar is a great choice.</p>
                      </div>
                    </div>

                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
};

export default ViewDataGuide;