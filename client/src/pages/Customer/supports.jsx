// pages/Customer/supports.jsx
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
  FaTimes
} from 'react-icons/fa';
import '../../styles/Customer/supports.css';

const Supports = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get tab from URL query parameter
  const getInitialTab = () => {
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    return ['faq', 'contact', 'info', 'tickets', 'guides'].includes(tab) ? tab : 'faq';
  };

  const [activeTab, setActiveTab] = useState(getInitialTab());
  const [openFaq, setOpenFaq] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  // New ticket state
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: ''
  });

  // Tickets state
  const [tickets, setTickets] = useState([
    { id: 'TKT-001', subject: 'Assessment scheduling', description: 'Need to reschedule my site assessment', date: '2024-03-15', status: 'resolved' },
    { id: 'TKT-002', subject: 'Payment confirmation', description: 'Payment was made but not reflected', date: '2024-03-10', status: 'in-progress' },
    { id: 'TKT-003', subject: 'Technical question', description: 'How to monitor system performance?', date: '2024-03-05', status: 'open' },
  ]);

  // Guides state
  const guides = [
    { id: 1, title: 'Solar System Installation Guide', type: 'PDF', size: '2.5 MB', url: '#' },
    { id: 2, title: 'Monitoring Dashboard Tutorial', type: 'PDF', size: '1.8 MB', url: '#' },
    { id: 3, title: 'Maintenance Tips', type: 'PDF', size: '1.2 MB', url: '#' },
    { id: 4, title: 'Understanding Your Solar Bill', type: 'PDF', size: '0.9 MB', url: '#' },
  ];

  // FAQ data
  const faqs = [
    {
      id: 1,
      question: 'How do I schedule a site assessment?',
      answer: 'You can schedule a site assessment by clicking the "Book Assessment" button on your dashboard. Fill out the required information and proceed to payment. Once confirmed, our team will contact you to schedule the actual site visit.'
    },
    {
      id: 2,
      question: 'What is included in the paid assessment?',
      answer: 'The paid assessment includes a 7-day IoT device monitoring at your site, collection of actual environmental data, a detailed report of findings, and personalized system recommendations.'
    },
    {
      id: 3,
      question: 'How long does installation take?',
      answer: 'Typical residential installation takes 2-5 days depending on system size and roof complexity. Commercial installations may take longer. Our team will provide a timeline during the planning phase.'
    },
    {
      id: 4,
      question: 'Do you offer warranty?',
      answer: 'Yes, we offer a 5-year warranty on workmanship and a 25-year performance warranty on solar panels. Inverter warranty varies by brand (typically 5-10 years).'
    },
    {
      id: 5,
      question: 'How do I track my system performance?',
      answer: 'You can monitor your system performance through the "System Performance" section in your dashboard. It shows real-time energy production, historical data, and savings.'
    },
    {
      id: 6,
      question: 'What payment methods do you accept?',
      answer: 'We accept GCash, bank transfer, and cash payments at our office. For installment options, please contact our sales team for more details.'
    }
  ];

  // Listen for URL tab changes
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
    setSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitting(false);
      setSubmitSuccess(true);
      setFormData({ name: '', email: '', subject: '', message: '' });
      setTimeout(() => setSubmitSuccess(false), 5000);
    }, 1500);
  };

  const handleCreateTicket = () => {
    if (!newTicket.subject || !newTicket.description) {
      alert('Please fill in all required fields');
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

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'faq':
        return (
          <div className="faq-section-support">
            <h2><FaQuestionCircle /> Frequently Asked Questions</h2>
            <div className="faq-list-support">
              {faqs.map(faq => (
                <div key={faq.id} className="faq-item-support">
                  <button 
                    className={`faq-question-support ${openFaq === faq.id ? 'open' : ''}`}
                    onClick={() => toggleFaq(faq.id)}
                  >
                    <span>{faq.question}</span>
                    {openFaq === faq.id ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                  {openFaq === faq.id && (
                    <div className="faq-answer-support">
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
          <div className="contact-section-support">
            <h2><FaEnvelope /> Send us a message</h2>
            
            {submitSuccess && (
              <div className="success-message-support">
                <FaCheckCircle />
                <span>Thank you! We'll get back to you soon.</span>
              </div>
            )}
            
            <form onSubmit={handleSubmit}>
              <div className="form-row-support">
                <div className="form-group-support">
                  <label>Full Name *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group-support">
                  <label>Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-row-support">
                <div className="form-group-support">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group-support">
                <label>Message *</label>
                <textarea
                  name="message"
                  rows="5"
                  value={formData.message}
                  onChange={handleInputChange}
                  required
                ></textarea>
              </div>

              <button type="submit" disabled={submitting} className="submit-btn-support">
                {submitting ? <><FaSpinner className="spinner-support" /> Sending...</> : 'Send Message'}
              </button>
            </form>
          </div>
        );

      case 'info':
        return (
          <div className="info-section-support">
            <h2><FaPhone /> Contact Information</h2>
            
            <div className="info-grid-support">
              <div className="info-card-support">
                <FaEnvelope className="info-icon-support" />
                <h3>Email</h3>
                <p>salfer.engineering@gmail.com</p>
                <small>Response within 24 hours</small>
              </div>
              <div className="info-card-support">
                <FaPhone className="info-icon-support" />
                <h3>Phone</h3>
                <p>0951-907-9171</p>
                <small>Mon-Fri, 9AM-6PM</small>
              </div>
              <div className="info-card-support">
                <FaMapMarkerAlt className="info-icon-support" />
                <h3>Office Address</h3>
                <p>Purok 2, Masaya, San Jose, Camarines Sur</p>
                <small>By appointment only</small>
              </div>
              <div className="info-card-support">
                <FaClock className="info-icon-support" />
                <h3>Office Hours</h3>
                <p>Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p>Saturday: 9:00 AM - 12:00 PM</p>
                <p>Sunday: Closed</p>
              </div>
            </div>
          </div>
        );

      case 'tickets':
        return (
          <div className="tickets-section-support">
            <div className="tickets-header-support">
              <h2><FaTicketAlt /> Support Tickets</h2>
              <button className="create-ticket-btn-support" onClick={() => setShowTicketModal(true)}>
                <FaPlus /> Create Ticket
              </button>
            </div>

            <div className="tickets-list-support">
              {tickets.length === 0 ? (
                <div className="empty-state-support">
                  <FaTicketAlt className="empty-icon-support" />
                  <h3>No tickets yet</h3>
                  <p>Create your first support ticket</p>
                </div>
              ) : (
                tickets.map(ticket => (
                  <div key={ticket.id} className="ticket-card-support">
                    <div className="ticket-header-support">
                      <div className="ticket-id-support">{ticket.id}</div>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <div className="ticket-subject-support">{ticket.subject}</div>
                    <div className="ticket-description-support">{ticket.description}</div>
                    <div className="ticket-footer-support">
                      <span className="ticket-date-support">{ticket.date}</span>
                      <button 
                        className="view-ticket-btn-support"
                        onClick={() => setSelectedTicket(selectedTicket === ticket.id ? null : ticket.id)}
                      >
                        <FaEye /> {selectedTicket === ticket.id ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>
                    {selectedTicket === ticket.id && (
                      <div className="ticket-details-support">
                        <div className="ticket-messages-support">
                          <div className="message-support customer">
                            <strong>You:</strong>
                            <p>{ticket.description}</p>
                            <small>{ticket.date}</small>
                          </div>
                          <div className="message-support support">
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
          <div className="guides-section-support">
            <h2><FaFileAlt /> User Guides & Resources</h2>
            <div className="guides-list-support">
              {guides.map(guide => (
                <div key={guide.id} className="guide-card-support">
                  <FaFileAlt className="guide-icon-support" />
                  <div className="guide-info-support">
                    <h3>{guide.title}</h3>
                    <p>{guide.type} • {guide.size}</p>
                  </div>
                  <button className="download-btn-support">
                    <FaDownload /> Download
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
        <meta name="description" content="Get help and support for your solar panel system. Find answers to common questions, contact our support team, and access helpful resources." />
      </Helmet>

      <div className="support-container">
        <h1 className="support-title">Support Center</h1>
        <p className="support-subtitle">How can we help you today?</p>

        {/* Tab Navigation Buttons - REMOVED! Navigation now handled by header */}
        {/* The content below will change based on the active tab from URL */}
        
        <div className="support-content">
          {renderTabContent()}
        </div>

        {/* Create Ticket Modal */}
        {showTicketModal && (
          <div className="modal-overlay-support" onClick={() => setShowTicketModal(false)}>
            <div className="modal-content-support" onClick={e => e.stopPropagation()}>
              <div className="modal-header-support">
                <h3>Create New Ticket</h3>
                <button className="modal-close-support" onClick={() => setShowTicketModal(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="modal-body-support">
                <div className="form-group-support">
                  <label>Subject *</label>
                  <input
                    type="text"
                    name="subject"
                    value={newTicket.subject}
                    onChange={handleTicketInputChange}
                    placeholder="Brief description of your issue"
                  />
                </div>
                
                <div className="form-group-support">
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
              
              <div className="modal-footer-support">
                <button className="cancel-btn-support" onClick={() => setShowTicketModal(false)}>
                  Cancel
                </button>
                <button 
                  className="submit-btn-support" 
                  onClick={handleCreateTicket}
                  disabled={!newTicket.subject || !newTicket.description}
                >
                  Submit Ticket
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Supports;