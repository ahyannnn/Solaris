// pages/Guides/TrackProjectGuide.jsx

import React, { useState, useEffect, useRef } from 'react';
import {
  FaProjectDiagram,
  FaCheckCircle,
  FaClock,
  FaUserTie,
  FaMoneyBillWave,
  FaPhotoVideo,
  FaChevronDown,
  FaChevronUp,
  FaArrowDown,
  FaStar,
  FaCalendarAlt,
  FaHome,
  FaFileAlt,
  FaClipboardList,
  FaInfoCircle,
  FaEye,
  FaUser,
  FaPhone,
  FaEnvelope
} from 'react-icons/fa';
import '../../styles/Guides/TrackProjectGuide.css';

const TrackProjectGuide = () => {
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
    { id: 'statuses', title: 'Project Statuses Explained', icon: FaInfoCircle },
    { id: 'overview', title: 'What You Can See in Your Project', icon: FaEye },
    { id: 'timeline', title: 'Project Timeline Example', icon: FaClock },
    { id: 'engineer', title: 'Your Assigned Engineer', icon: FaUserTie },
    { id: 'checklist', title: 'Project Completion Checklist', icon: FaClipboardList },
  ];

  return (
    <div className="track-guide-page">
      {/* Premium Hero Section */}
      <section className="track-hero">
        <div className="track-hero-overlay"></div>
        <div className="track-hero-background-shapes">
          <div className="shape shape-1"></div>
          <div className="shape shape-2"></div>
          <div className="shape shape-3"></div>
        </div>
        <div className="track-hero-content">
          <h1 className="track-hero-title">
            How to Track Your<br />
            <span className="highlight-text">Project</span>
          </h1>
          <p className="track-hero-subtitle">
            Monitor your solar project progress and status from start to finish
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
            className={`track-section ${isEven ? 'section-light' : 'section-dark'} ${isVisible[section.id] ? 'visible' : ''}`}
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
                {section.id === 'statuses' && (
                  <div className="statuses-list">
                    {[
                      'Pending',
                      'Under Review',
                      'Scheduled',
                      'Quotation Ready',
                      'Approved',
                      'Installation in Progress',
                      'Completed'
                    ].map((label, i) => (
                      <div key={i} className="status-item">
                        <span className="status-item-number">{i + 1}</span>
                        <span className="status-item-label">{label}</span>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'overview' && (
                  <div className="overview-grid">
                    {[
                      { icon: FaHome, title: 'Overview Tab', items: ['System specifications', 'Installation address', 'Assigned engineer details', 'Current project status', 'Start and end dates'] },
                      { icon: FaClock, title: 'Timeline Tab', items: ['Key milestones', 'Completed stages', 'Current stage', 'Upcoming stages', 'Estimated completion date'] },
                      { icon: FaMoneyBillWave, title: 'Payments Tab', items: ['Total project cost', 'How much you have paid', 'Remaining balance', 'Payment history', 'Invoice status'] },
                      { icon: FaPhotoVideo, title: 'Media Tab', items: ['Site photos', 'Installation progress photos', 'Before and after images', 'Engineer documentation'] },
                      { icon: FaUserTie, title: 'Personnel Tab', items: ['Assigned engineer name', 'Contact number', 'Team members', 'Support contacts'] },
                    ].map((tab, i) => (
                      <div key={i} className="overview-card">
                        <div className="overview-card-header">
                          <div className="overview-card-icon">
                            <tab.icon />
                          </div>
                          <h4>{tab.title}</h4>
                        </div>
                        <ul className="overview-list">
                          {tab.items.map((item, j) => (
                            <li key={j}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

                {section.id === 'timeline' && (
                  <div className="timeline-content">
                    <div className="timeline-steps">
                      {[
                        { label: 'Booking Submitted', week: 'Week 1' },
                        { label: 'Admin Approved', week: 'Week 1' },
                        { label: 'Site Visit Scheduled', week: 'Week 1' },
                        { label: '7-Day Monitoring', week: 'Week 2' },
                        { label: 'Quotation Ready', week: 'Week 2' },
                        { label: 'Quotation Accepted', week: 'Week 2-3' },
                        { label: 'Payment Completed', week: 'Week 3' },
                        { label: 'Installation', week: 'Week 3-4' },
                        { label: 'Project Complete', week: 'Week 4' },
                      ].map((step, i) => (
                        <div key={i} className="timeline-step">
                          <div className="timeline-marker">
                            <span>{i + 1}</span>
                            {i < 8 && <div className="timeline-line"></div>}
                          </div>
                          <div className="timeline-content">
                            <h4>{step.label}</h4>
                            <span className="timeline-week">{step.week}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {section.id === 'engineer' && (
                  <div className="engineer-content">
                    <div className="engineer-info">
                      <div className="engineer-avatar">
                        <FaUser />
                      </div>
                      <div className="engineer-details">
                        <h4>Your Assigned Engineer</h4>
                        <p className="engineer-name">Engr. Maria Santos</p>
                        <div className="engineer-contact">
                          <span><FaPhone /> +63 912 345 6789</span>
                          <span><FaEnvelope /> maria.santos@salfer-solar.com</span>
                        </div>
                      </div>
                    </div>
                    <div className="engineer-actions">
                      <h4>You Can:</h4>
                      <ul>
                        <li>Contact them directly</li>
                        <li>Ask questions about the project</li>
                        <li>Coordinate site visits</li>
                        <li>Request updates</li>
                      </ul>
                    </div>
                  </div>
                )}

                {section.id === 'checklist' && (
                  <div className="checklist-content">
                    <div className="checklist-grid">
                      {[
                        { label: 'Assessment complete', icon: FaCheckCircle },
                        { label: 'Quotation accepted', icon: FaCheckCircle },
                        { label: 'Payment done', icon: FaCheckCircle },
                        { label: 'Installation done', icon: FaCheckCircle },
                        { label: 'Turnover complete', icon: FaCheckCircle },
                      ].map((item, i) => (
                        <div key={i} className="checklist-item">
                          <div className="checklist-icon">
                            <item.icon />
                          </div>
                          <span>{item.label}</span>
                          <span className="checklist-status">Done</span>
                        </div>
                      ))}
                    </div>
                    <div className="checklist-note">
                      <FaInfoCircle className="checklist-note-icon" />
                      <p>All items must be completed before your project is marked as finished.</p>
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

export default TrackProjectGuide;