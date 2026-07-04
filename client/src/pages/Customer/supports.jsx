// pages/Customer/supports.jsx - Redesigned
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
  FaArrowRight
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

  const guides = [
    { id: 1, title: 'Solar System Installation Guide', type: 'PDF', size: '2.5 MB' },
    { id: 2, title: 'Monitoring Dashboard Tutorial', type: 'PDF', size: '1.8 MB' },
    { id: 3, title: 'Maintenance Tips', type: 'PDF', size: '1.2 MB' },
    { id: 4, title: 'Understanding Your Solar Bill', type: 'PDF', size: '0.9 MB' },
  ];

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
              <FaFileAlt />
              <h2>User Guides & Resources</h2>
            </div>
            <div className="cusup-guides-list">
              {guides.map(guide => (
                <div key={guide.id} className="cusup-guide-card">
                  <FaFileAlt className="cusup-guide-icon" />
                  <div className="cusup-guide-info">
                    <h3>{guide.title}</h3>
                    <p>{guide.type} • {guide.size}</p>
                  </div>
                  <button className="cusup-download-btn" onClick={() => showToast('Download started!', 'success')}>
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