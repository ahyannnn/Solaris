// BookAssessmentGuide.jsx - Payment Section Fixed (6 items, no highlight)

import React, { useState, useEffect, useRef } from 'react';
import { 
  FaClipboardList, 
  FaUser, 
  FaMapMarkerAlt, 
  FaPhone, 
  FaCreditCard, 
  FaHome,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaClock,
  FaUserTie,
  FaMicrochip,
  FaCalendarAlt,
  FaMoneyBillWave,
  FaCheck,
  FaExclamationTriangle,
  FaArrowDown,
  FaFileAlt,
  FaChartBar,
  FaSun,
  FaTools,
  FaBuilding,
  FaInfoCircle,
  FaStar
} from 'react-icons/fa';
import '../../styles/Guides/BookAssessmentGuide.css';

const BookAssessmentGuide = () => {
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
    { id: 'needs', title: 'What You Need Before Booking', icon: FaInfoCircle },
    { id: 'steps', title: 'Step-by-Step Booking Process', icon: FaClipboardList },
    { id: 'next', title: 'What Happens Next', icon: FaClock },
    { id: 'payment', title: 'Payment Process After Booking', icon: FaCreditCard },
    { id: 'cancel', title: 'Cancellation Policy', icon: FaExclamationTriangle },
  ];

  return (
    <div className="guide-page">
      {/* Premium Hero Section */}
      <section className="guide-hero">
        <div className="guide-hero-overlay"></div>
        <div className="guide-hero-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="guide-hero-content">
          <h1 className="guide-hero-title">
            How to Book a<br />
            <span className="highlight-text">Pre-Assessment</span>
          </h1>
          <p className="guide-hero-subtitle">
            Your comprehensive guide to scheduling a professional solar site assessment
          </p>
          <div className="scroll-indicator">
            <span>Scroll to explore</span>
            <FaArrowDown className="scroll-arrow" />
          </div>
        </div>
      </section>

      {/* 5 Comprehensive Sections */}
      {sections.map((section, index) => {
        const SectionIcon = section.icon;
        const isEven = index % 2 === 0;
        return (
          <section
            key={section.id}
            id={section.id}
            ref={(el) => (sectionRefs.current[section.id] = el)}
            className={`guide-section ${isEven ? 'section-light' : 'section-dark'} ${isVisible[section.id] ? 'visible' : ''}`}
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
                {section.id === 'needs' && (
                  <div className="needs-grid">
                    {[
                      { icon: FaUser, title: 'Account', desc: 'You must be logged in to SOLARIS' },
                      { icon: FaMapMarkerAlt, title: 'Address', desc: 'Complete property address' },
                      { icon: FaPhone, title: 'Contact Info', desc: 'Active phone number and email' },
                      { icon: FaCreditCard, title: 'Payment Method', desc: 'GCash, Bank Transfer, or Cash' },
                      { icon: FaHome, title: 'Property Details', desc: 'Roof type, size, and property type' },
                    ].map((item, i) => (
                      <div key={i} className="need-card">
                        <div className="need-card-icon">
                          <item.icon />
                        </div>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'steps' && (
                  <div className="steps-timeline">
                    {[
                      { title: 'Go to the Booking Page', desc: 'Click "Services" in the main menu, then click "Book Pre-Assessment". Or click the "Book Assessment" button on your dashboard.' },
                      { title: 'Fill Out the Booking Form', desc: 'Property Type, Personal Info, Address, System Preferences, Special Notes', isDetailed: true },
                      { title: 'Check Your Information', desc: 'Double-check all details. Make sure your address is correct. Verify your contact information.' },
                      { title: 'Agree to Terms', desc: 'Read the Terms and Conditions, check the agreement box, and click "Book Pre-Assessment".' },
                      { title: 'Wait for Confirmation', desc: 'You will receive a booking reference number, confirmation email, and notification that admin is reviewing your booking.' },
                    ].map((step, i) => (
                      <div key={i} className="step-item">
                        <div className="step-marker">
                          <span>{i + 1}</span>
                          {i < 4 && <div className="step-line"></div>}
                        </div>
                        <div className="step-content">
                          <h4>{step.title}</h4>
                          <p>{step.desc}</p>
                          {step.isDetailed && (
                            <div className="step-details">
                              {[
                                { icon: FaBuilding, label: 'Property Type' },
                                { icon: FaUser, label: 'Personal Info' },
                                { icon: FaMapMarkerAlt, label: 'Address' },
                                { icon: FaSun, label: 'System Preferences' },
                                { icon: FaTools, label: 'Special Notes' },
                              ].map((detail, j) => (
                                <span key={j} className="detail-tag">
                                  <detail.icon /> {detail.label}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'next' && (
                  <div className="flow-process">
                    {[
                      { icon: FaClipboardList, label: 'Booking Submitted' },
                      { icon: FaUserTie, label: 'Admin Review (24-48h)' },
                      { icon: FaUserTie, label: 'Engineer Assigned' },
                      { icon: FaMicrochip, label: 'IoT Device Prepared' },
                      { icon: FaCalendarAlt, label: 'Schedule Coordinated' },
                      { icon: FaMoneyBillWave, label: 'Payment Required' },
                      { icon: FaCheckCircle, label: 'Booking Confirmed', highlight: true },
                    ].map((step, i) => (
                      <div key={i} className="flow-item">
                        <div className="flow-icon-wrapper">
                          <step.icon className={`flow-icon ${step.highlight ? 'highlight' : ''}`} />
                        </div>
                        <span className="flow-label">{step.label}</span>
                        {i < 6 && <FaArrowDown className="flow-arrow" />}
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'payment' && (
                  <div className="payment-grid">
                    {[
                      { icon: FaFileAlt, label: 'Receive Invoice', desc: 'Check your billing dashboard' },
                      { icon: FaCreditCard, label: 'Choose Payment Method', desc: 'GCash, Bank Transfer, or Cash' },
                      { icon: FaMoneyBillWave, label: 'Make Payment', desc: 'Follow the payment instructions' },
                      { icon: FaCheck, label: 'Upload Proof', desc: 'For GCash or Bank, upload screenshot or receipt' },
                      { icon: FaClock, label: 'Wait for Verification', desc: 'Takes 24-48 hours' },
                      { icon: FaCheckCircle, label: 'Booking Confirmed', desc: 'Status updates to "Paid"' },
                    ].map((item, i) => (
                      <div key={i} className="payment-card">
                        <div className="payment-card-icon">
                          <item.icon />
                        </div>
                        <h4>{item.label}</h4>
                        <p>{item.desc}</p>
                        <div className="payment-step-number">{i + 1}</div>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'cancel' && (
                  <div className="cancel-content">
                    <div className="cancel-table-wrapper">
                      <div className="cancel-table">
                        <div className="cancel-header">
                          <span>When You Cancel</span>
                          <span>What You Get Back</span>
                        </div>
                        <div className="cancel-row">
                          <span>72+ hours before deployment</span>
                          <span className="refund-good">80% refund</span>
                        </div>
                        <div className="cancel-row">
                          <span>48-72 hours before</span>
                          <span className="refund-medium">50% refund</span>
                        </div>
                        <div className="cancel-row">
                          <span>Less than 48 hours</span>
                          <span className="refund-bad">No refund</span>
                        </div>
                      </div>
                    </div>
                    <div className="cancel-note">
                      <FaCalendarAlt className="cancel-note-icon" />
                      <p>You can also reschedule once if you inform us at least 48 hours in advance.</p>
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

export default BookAssessmentGuide;