// pages/Guides/PaymentGuide.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  FaCreditCard,
  FaMoneyBillWave,
  FaCheckCircle,
  FaClock,
  FaArrowDown,
  FaEnvelope,
  FaPhone,
  FaBuilding,
  FaFileInvoice,
  FaUpload,
  FaCheck,
  FaSpinner,
  FaExclamationTriangle,
  FaCalendarAlt,
  FaStar,
  FaChevronDown,
  FaChevronUp
} from 'react-icons/fa';
import '../../styles/Guides/PaymentGuide.css';

const PaymentGuide = () => {
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
    { id: 'when', title: 'When You Need to Pay', icon: FaClock },
    { id: 'methods', title: 'Payment Methods Available', icon: FaCreditCard },
    { id: 'arrangements', title: 'Payment Arrangements', icon: FaMoneyBillWave },
    { id: 'verification', title: 'Payment Verification Process', icon: FaCheckCircle },
    { id: 'tips', title: 'Payment Tips & Reminders', icon: FaStar },
  ];

  return (
    <div className="payment-guide-page">
      {/* Premium Hero Section */}
      <section className="payment-hero">
        <div className="payment-hero-overlay"></div>
        <div className="payment-hero-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="payment-hero-content">
          <h1 className="payment-hero-title">
            How to Make a<br />
            <span className="highlight-text">Payment</span>
          </h1>
          <p className="payment-hero-subtitle">
            A simple guide to pay for your solar assessment and installation
          </p>
          <div className="scroll-indicator">
            <span>Scroll to explore</span>
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
            className={`payment-section ${isEven ? 'section-light' : 'section-dark'} ${isVisible[section.id] ? 'visible' : ''}`}
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
                {section.id === 'when' && (
                  <div className="when-grid">
                    {[
                      { icon: FaFileInvoice, title: 'Assessment Fee', desc: 'After booking the pre-assessment' },
                      { icon: FaMoneyBillWave, title: 'Project Down Payment', desc: 'After you accept the quotation' },
                      { icon: FaClock, title: 'Progress Payment', desc: 'During the installation phase' },
                      { icon: FaCheckCircle, title: 'Retention Payment', desc: 'After the project is completed' },
                    ].map((item, i) => (
                      <div key={i} className="when-card">
                        <div className="when-card-icon">
                          <item.icon />
                        </div>
                        <h4>{item.title}</h4>
                        <p>{item.desc}</p>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'methods' && (
                  <div className="methods-grid">
                    {[
                      {
                        icon: FaCreditCard,
                        title: 'GCash',
                        steps: [
                          'Open your GCash app',
                          'Send payment to our GCash number',
                          'Take a screenshot of the transaction',
                          'Go to "Billing" in SOLARIS',
                          'Click "Pay Now" on your invoice',
                          'Select GCash as your payment method',
                          'Upload the screenshot',
                          'Enter the transaction reference number',
                          'Click Submit'
                        ]
                      },
                      {
                        icon: FaBuilding,
                        title: 'Bank Transfer',
                        banks: 'BDO, BPI, Metrobank, Security Bank',
                        steps: [
                          'Go to your bank (online or in person)',
                          'Transfer money to our bank account',
                          'Get the transaction reference number',
                          'Take a photo of the deposit slip',
                          'Go to "Billing" in SOLARIS',
                          'Click "Pay Now" on your invoice',
                          'Select your bank',
                          'Upload proof of payment',
                          'Enter the reference number',
                          'Click Submit'
                        ]
                      },
                      {
                        icon: FaMoneyBillWave,
                        title: 'Cash Payment',
                        steps: [
                          'Visit our office',
                          'Pay the amount',
                          'Receive an official receipt',
                          'The update will show in your dashboard'
                        ]
                      },
                      {
                        icon: FaCreditCard,
                        title: 'Credit / Debit Card',
                        steps: [
                          'Select Credit/Debit Card as payment method',
                          'Enter your card details',
                          'Enter the OTP sent to your phone',
                          'Wait for confirmation',
                          'Payment will reflect immediately'
                        ]
                      },
                    ].map((method, i) => (
                      <div key={i} className="method-card">
                        <div className="method-header">
                          <div className="method-icon-wrapper">
                            <method.icon />
                          </div>
                          <h3>{method.title}</h3>
                        </div>
                        {method.banks && (
                          <p className="method-banks"><strong>Supported Banks:</strong> {method.banks}</p>
                        )}
                        <ol className="method-steps">
                          {method.steps.map((step, j) => (
                            <li key={j}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'arrangements' && (
                  <div className="arrangements-content">
                    <div className="arrangements-table-wrapper">
                      <div className="arrangements-table">
                        <div className="arrangements-header">
                          <span>Scheme</span>
                          <span>Down Payment</span>
                          <span>Progress</span>
                          <span>Retention</span>
                        </div>
                        <div className="arrangements-row">
                          <span className="scheme-name">Full Payment</span>
                          <span>100%</span>
                          <span>—</span>
                          <span>—</span>
                        </div>
                        <div className="arrangements-row">
                          <span className="scheme-name">50/50</span>
                          <span>50%</span>
                          <span>50%</span>
                          <span>—</span>
                        </div>
                        <div className="arrangements-row">
                          <span className="scheme-name">30/60/10</span>
                          <span>30%</span>
                          <span>60%</span>
                          <span>10%</span>
                        </div>
                      </div>
                    </div>
                    <p className="arrangements-note">
                      The payment arrangement depends on what you agree with the company.
                    </p>
                  </div>
                )}

                {section.id === 'verification' && (
                  <div className="verification-content">
                    <div className="verification-timeline">
                      {[
                        { icon: FaUpload, label: 'You submit payment', time: 'Day 0' },
                        { icon: FaSpinner, label: 'Admin reviews it', time: '24-48 hours' },
                        { icon: FaCheckCircle, label: 'Status updates to "Paid"', time: 'Around 48 hours' },
                        { icon: FaClock, label: 'Project continues', time: 'Immediately after' },
                      ].map((item, i) => (
                        <div key={i} className="verification-step">
                          <div className="verification-step-icon">
                            <item.icon />
                          </div>
                          <div className="verification-step-content">
                            <h4>{item.label}</h4>
                            <span className="verification-step-time">{item.time}</span>
                          </div>
                          {i < 3 && <FaArrowDown className="verification-arrow" />}
                        </div>
                      ))}
                    </div>
                    <div className="verification-statuses">
                      <h4>Payment Statuses</h4>
                      <div className="status-grid">
                        {[
                          { label: 'Pending', desc: 'You submitted it, waiting for review' },
                          { label: 'Under Review', desc: 'Admin is checking your payment' },
                          { label: 'Paid', desc: 'Payment is verified and confirmed' },
                          { label: 'Rejected', desc: 'Invalid proof, you need to resubmit' },
                        ].map((status, i) => (
                          <div key={i} className="status-item">
                            <div>
                              <strong>{status.label}</strong>
                              <p>{status.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {section.id === 'tips' && (
                  <div className="tips-content">
                    <div className="tips-grid">
                      {[
                        { icon: FaFileInvoice, title: 'Keep your receipt', desc: 'You need the reference number' },
                        { icon: FaUpload, title: 'Upload clear images', desc: 'Blurry receipts cause delays' },
                        { icon: FaCheck, title: 'Double-check the amount', desc: 'Make sure you pay the exact amount' },
                        { icon: FaCreditCard, title: 'Use the correct reference', desc: 'Match reference to your invoice' },
                        { icon: FaClock, title: 'Wait for verification', desc: "Don't pay twice" },
                      ].map((tip, i) => (
                        <div key={i} className="tip-card">
                          <div className="tip-card-icon">
                            <tip.icon />
                          </div>
                          <h4>{tip.title}</h4>
                          <p>{tip.desc}</p>
                        </div>
                      ))}
                    </div>
                    <div className="tips-cancel-section">
                      <h4>Cancellation and Refund</h4>
                      <div className="cancel-table">
                        <div className="cancel-header">
                          <span>When You Cancel</span>
                          <span>Refund</span>
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

export default PaymentGuide;