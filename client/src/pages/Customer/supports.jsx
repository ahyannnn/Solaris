// pages/Customer/supports.jsx - Redesigned with Guide Links

import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { 
  FaQuestionCircle,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaClock,
  FaChevronDown,
  FaChevronUp,
  FaCheckCircle,
  FaSpinner,
  FaTicketAlt,
  FaFileAlt,
  FaDownload,
  FaPlus,
  FaEye,
  FaTimes,
  FaHeadset,
  FaInfoCircle,
  FaArrowRight,
  FaBookOpen,
  FaExternalLinkAlt
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Customer/supports.css';

const Supports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast, showToast, hideToast } = useToast();
  
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return ['faq', 'contact', 'info', 'tickets', 'guides'].includes(tab) ? tab : 'faq';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [openFaq, setOpenFaq] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: ''
  });

  const [tickets, setTickets] = useState([
    { id: 'TKT-001', subject: 'Assessment scheduling', description: 'Need to reschedule my site assessment', date: '2024-03-15', status: 'resolved' },
    { id: 'TKT-002', subject: 'Payment confirmation', description: 'Payment was made but not reflected', date: '2024-03-10', status: 'in-progress' },
    { id: 'TKT-003', subject: 'Technical question', description: 'How to monitor system performance?', date: '2024-03-05', status: 'open' },
  ]);

  // Updated Guides - Now links to the 4 guide pages
  const guides = [
    { 
      id: 1, 
      title: 'How to Book a Pre-Assessment', 
      type: 'Guide',
      description: 'Step-by-step guide to schedule your solar site assessment',
      link: '/guides/book-assessment',
      icon: <FaBookOpen />
    },
    { 
      id: 2, 
      title: 'How to Make a Payment', 
      type: 'Guide',
      description: 'Complete guide on payment methods and processes',
      link: '/guides/payment',
      icon: <FaBookOpen />
    },
    { 
      id: 3, 
      title: 'How to Track Your Projects', 
      type: 'Guide',
      description: 'Monitor your solar project progress and status',
      link: '/guides/track-project',
      icon: <FaBookOpen />
    },
    { 
      id: 4, 
      title: 'How Solar Panels Save You Money', 
      type: 'Guide',
      description: 'A simple explanation of how solar energy can reduce your electricity bills',
      link: '/guides/view-data',
      icon: <FaBookOpen />
    },
  ];

  const faqs = [
    {
      id: 1,
      question: 'Is the free quotation really free?',
      answer: 'YES! Totally free. No payment, no obligation. You will get an estimate of how much you can save and how many solar panels you might need for your property.'
    },
    {
      id: 2,
      question: 'How accurate is the free quotation?',
      answer: 'It is an estimate based on average values. If you want exact measurements for your specific property, you will need to book a pre-assessment which is paid but definitely worth it.'
    },
    {
      id: 3,
      question: 'What do I need to provide for a free quotation?',
      answer: 'You will need to provide your monthly electric bill amount, your electricity rate (found on your bill), how many sun hours your area gets, your property type (residential or commercial), and your roof size.'
    },
    {
      id: 4,
      question: 'What is a pre-assessment and why do I need it?',
      answer: 'A pre-assessment is a 7-day monitoring of your property where an engineer installs an IoT device that measures solar irradiance, temperature, humidity, and GPS location. It provides exact site-specific data for accurate system design.'
    },
    {
      id: 5,
      question: 'Will the monitoring device damage my roof?',
      answer: 'NO! It is a temporary installation only. The engineer carefully installs and removes the device after the 7-day monitoring period with no damage to your roof.'
    },
    {
      id: 6,
      question: 'What happens if it rains during the monitoring period?',
      answer: 'The device works perfectly even on cloudy or rainy days. If 3 or more days are significantly affected by bad weather, we can extend the monitoring period for FREE.'
    },
    {
      id: 7,
      question: 'Can I cancel my pre-assessment booking?',
      answer: 'Yes, but refund depends on when you cancel. 72+ hours before deployment = 80% refund. 48-72 hours before = 50% refund. Less than 48 hours = non-refundable. You can also reschedule once with 48 hours advance notice.'
    },
    {
      id: 8,
      question: 'How long is the quotation valid?',
      answer: 'The quotation is valid for 30 days from the date it was issued. After 30 days, you will need to request a new quotation.'
    },
    {
      id: 9,
      question: 'Can I decline the quotation if I change my mind?',
      answer: 'YES, absolutely! You are not obligated to proceed with the installation. The assessment fee covers the data and report you already received.'
    },
    {
      id: 10,
      question: 'What payment methods do you accept?',
      answer: 'We accept GCash (upload screenshot of payment), Bank Transfer (BDO, BPI, Metrobank, Security Bank), and Cash payments at our office.'
    },
    {
      id: 11,
      question: 'Can I pay in installments?',
      answer: 'YES! We offer flexible payment arrangements. Full payment (100%), 50/50 scheme (50% down, 50% completion), or 30/60/10 scheme (30% down, 60% progress, 10% retention).'
    },
    {
      id: 12,
      question: 'How long does payment verification take?',
      answer: 'Payment verification usually takes 24-48 hours. The status will update from "Pending" to "Paid" once verified, and you will receive a confirmation email.'
    },
    {
      id: 13,
      question: 'How do I check my project status?',
      answer: 'Simply go to the "My Projects" page in your dashboard. You can see real-time updates including Pending, Under Review, Scheduled, Assessment in Progress, Quotation Ready, Installation in Progress, or Completed.'
    },
    {
      id: 14,
      question: 'How long does the entire process take?',
      answer: 'The complete process usually takes 2-4 weeks depending on engineer availability, weather conditions, site conditions, and installation schedule.'
    },
    {
      id: 15,
      question: 'What happens after the 7-day monitoring?',
      answer: 'After monitoring, the engineer collects the data, creates a detailed report, generates your custom quotation, and you decide whether to accept and proceed with the installation.'
    },
    {
      id: 16,
      question: 'What data does the IoT device collect?',
      answer: 'The device collects solar irradiance (sunlight intensity in W/m²), ambient temperature, relative humidity, and GPS coordinates of your property.'
    },
    {
      id: 17,
      question: 'How do I view my site data and reports?',
      answer: 'Go to "My Projects", select your project, click the "IoT Data" or "Site Data" tab, and view the graphs and charts. Reports can be downloaded as PDF.'
    },
    {
      id: 18,
      question: 'What reports will I receive?',
      answer: 'You will receive a Site Assessment Report (site condition, shading analysis, orientation, usable area) and a System Design Report (recommended system size, number of panels, equipment specifications).'
    },
    {
      id: 19,
      question: 'How do I contact support if I have concerns?',
      answer: 'You can go to the "Support" page, fill out the contact form, and track your ticket in "My Tickets". You can also email support@salfer-solar.com or call [Company Number].'
    },
    {
      id: 20,
      question: 'Do I need to be home during the monitoring period?',
      answer: 'Not necessarily. The engineer will install the device and retrieve it after 7 days. You do not need to be home the entire time, only during installation and retrieval.'
    }
  ];

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const tabFromUrl = params.get('tab');
    if (tabFromUrl && ['faq', 'contact', 'info', 'tickets', 'guides'].includes(tabFromUrl)) {
      if (tabFromUrl !== activeTab) {
        setActiveTab(tabFromUrl);
      }
    }
  }, [location.search, activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleTicketInputChange = (e) => {
    const { name, value } = e.target;
    setNewTicket(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    
    setSubmitting(true);
    
    setTimeout(() => {
      setSubmitting(false);
      showToast('Message sent successfully! We\'ll get back to you soon.', 'success');
      setFormData({ name: '', email: '', subject: '', message: '' });
    }, 1500);
  };

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.description) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }
    
    const newTicketData = {
      id: `TKT-${String(tickets.length + 1).padStart(3, '0')}`,
      subject: newTicket.subject,
      description: newTicket.description,
      date: new Date().toISOString().split('T')[0],
      status: 'open'
    };
    setTickets([newTicketData, ...tickets]);
    setNewTicket({ subject: '', description: '' });
    setShowTicketModal(false);
    showToast('Ticket created successfully!', 'success');
  };

  const toggleFaq = (id) => {
    setOpenFaq(openFaq === id ? null : id);
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'open':
        return <span className="status-badge-support open">Open</span>;
      case 'in-progress':
        return <span className="status-badge-support in-progress">In Progress</span>;
      case 'resolved':
        return <span className="status-badge-support resolved">Resolved</span>;
      default:
        return <span className="status-badge-support">{status}</span>;
    }
  };

  // Handle guide link click - open in new tab or navigate
  const handleGuideClick = (link) => {
    // You can use navigate if it's internal or window.open for new tab
    // Option 1: Navigate within the app
    // navigate(link);
    
    // Option 2: Open in new tab (recommended for guides)
    window.open(link, '_blank');
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'faq':
        return (
          <div className="cusup-section">
            <div className="cusup-section-header">
              <FaQuestionCircle />
              <h2>Frequently Asked Questions</h2>
            </div>
            <div className="cusup-faq-list">
              {faqs.map(faq => (
                <div key={faq.id} className="cusup-faq-item">
                  <button 
                    className={`cusup-faq-question ${openFaq === faq.id ? 'open' : ''}`}
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <span>{faq.question}</span>
                    {openFaq === faq.id ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                  {openFaq === faq.id && (
                    <div className="cusup-faq-answer">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="cusup-section">
            <div className="cusup-section-header">
              <FaEnvelope />
              <h2>Send us a message</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="cusup-contact-form">
              <div className="cusup-form-row">
                <div className="cusup-form-group">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    required
                  />
                </div>
                <div className="cusup-form-group">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Enter your email"
                    required
                  />
                </div>
              </div>

              <div className="cusup-form-group">
                <label>Subject *</label>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="What is this about?"
                  required
                />
              </div>

              <div className="cusup-form-group">
                <label>Message *</label>
                <textarea
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleInputChange}
                  placeholder="Describe your concern in detail..."
                  required
                ></textarea>
              </div>

              <button type="submit" disabled={submitting} className="cusup-submit-btn">
                {submitting ? <><FaSpinner className="spinning" /> Sending...</> : 'Send Message'}
              </button>
            </form>
          </div>
        );

      case 'info':
        return (
          <div className="cusup-section">
            <div className="cusup-section-header">
              <FaPhone />
              <h2>Contact Information</h2>
            </div>
            
            <div className="cusup-info-grid">
              <div className="cusup-info-card">
                <div className="cusup-info-icon">
                  <FaEnvelope />
                </div>
                <h3>Email</h3>
                <p>salfer.engineering@gmail.com</p>
                <small>Response within 24 hours</small>
              </div>
              <div className="cusup-info-card">
                <div className="cusup-info-icon">
                  <FaPhone />
                </div>
                <h3>Phone</h3>
                <p>0951-907-9171</p>
                <small>Mon-Fri, 9AM-6PM</small>
              </div>
              <div className="cusup-info-card">
                <div className="cusup-info-icon">
                  <FaMapMarkerAlt />
                </div>
                <h3>Office Address</h3>
                <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                <small>By appointment only</small>
              </div>
              <div className="cusup-info-card">
                <div className="cusup-info-icon">
                  <FaClock />
                </div>
                <h3>Office Hours</h3>
                <p>Mon-Fri: 9:00 AM - 6:00 PM</p>
                <p>Sat: 9:00 AM - 12:00 PM</p>
                <p>Sun: Closed</p>
              </div>
            </div>
          </div>
        );

      case 'tickets':
        return (
          <div className="cusup-section">
            <div className="cusup-tickets-header">
              <div className="cusup-section-header">
                <FaTicketAlt />
                <h2>Support Tickets</h2>
              </div>
              <button className="cusup-create-ticket-btn" onClick={() => setShowTicketModal(true)}>
                <FaPlus /> Create Ticket
              </button>
            </div>

            <div className="cusup-tickets-list">
              {tickets.length === 0 ? (
                <div className="cusup-empty-state">
                  <FaTicketAlt className="empty-icon" />
                  <h3>No tickets yet</h3>
                  <p>Create your first support ticket</p>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div key={ticket.id} className="cusup-ticket-card">
                    <div className="cusup-ticket-header">
                      <div className="cusup-ticket-id">{ticket.id}</div>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <div className="cusup-ticket-subject">{ticket.subject}</div>
                    <div className="cusup-ticket-description">{ticket.description}</div>
                    <div className="cusup-ticket-footer">
                      <span className="cusup-ticket-date">{ticket.date}</span>
                      <button 
                        className="cusup-view-ticket-btn"
                        onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                      >
                        <FaEye /> {selectedTicket === ticket.id ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>
                    {selectedTicket === ticket.id && (
                      <div className="cusup-ticket-details">
                        <div className="cusup-ticket-messages">
                          <div className="cusup-message customer">
                            <strong>You:</strong>
                            <p>{ticket.description}</p>
                            <small>{ticket.date}</small>
                          </div>
                          <div className="cusup-message support">
                            <strong>Support Team:</strong>
                            <p>We have received your ticket and will respond within 24 hours.</p>
                            <small>{ticket.date}</small>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'guides':
        return (
          <div className="cusup-section">
            <div className="cusup-section-header">
              <FaBookOpen />
              <h2>User Guides & Resources</h2>
            </div>
            <div className="cusup-section-description">
              <p>Browse our comprehensive guides to help you navigate SOLARIS with ease.</p>
            </div>
            <div className="cusup-guides-list">
              {guides.map(guide => (
                <div key={guide.id} className="cusup-guide-card guide-clickable" onClick={() => handleGuideClick(guide.link)}>
                  <div className="cusup-guide-icon-wrapper">
                    {guide.icon}
                  </div>
                  <div className="cusup-guide-info">
                    <h3>{guide.title}</h3>
                    <p>{guide.description}</p>
                    <span className="cusup-guide-type">{guide.type}</span>
                  </div>
                  <button className="cusup-guide-open-btn" onClick={(e) => {
                    e.stopPropagation();
                    handleGuideClick(guide.link);
                  }}>
                    <FaExternalLinkAlt /> Open Guide
                  </button>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Helmet>
        <title>Support Center | Salfer Engineering</title>
      </Helmet>

      <div className="cusup-container">
        <div className="cusup-header">
          <div className="cusup-header-content">
            <h1>Support Center</h1>
            <p>How can we help you today?</p>
          </div>
          <div className="cusup-header-icon">
            <FaHeadset />
          </div>
        </div>
        
        <div className="cusup-content">
          {renderTabContent()}
        </div>

        {/* Create Ticket Modal */}
        {showTicketModal && (
          <div className="cusup-modal-overlay" onClick={() => setShowTicketModal(false)}>
            <div className="cusup-modal" onClick={e => e.stopPropagation()}>
              <div className="cusup-modal-header">
                <h3>Create New Ticket</h3>
                <button className="cusup-modal-close" onClick={() => setShowTicketModal(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="cusup-modal-body">
                <div className="cusup-form-group">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={newTicket.subject}
                    onChange={handleTicketInputChange}
                    placeholder="Brief description of your issue"
                  />
                </div>
                
                <div className="cusup-form-group">
                  <label>Description *</label>
                  <textarea
                    name="description"
                    rows="5"
                    value={newTicket.description}
                    onChange={handleTicketInputChange}
                    placeholder="Please provide details about your issue"
                  ></textarea>
                </div>
              </div>
              
              <div className="cusup-modal-footer">
                <button className="cusup-cancel-btn" onClick={() => setShowTicketModal(false)}>
                  Cancel
                </button>
                <button 
                  className="cusup-submit-ticket-btn" 
                  onClick={handleCreateTicket}
                  disabled={!newTicket.subject || !newTicket.description}
                >
                  Submit Ticket
                </button>
              </div>
            </div>
          </div>
        )}

        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      </div>
    </>
  );
};

export default Supports;