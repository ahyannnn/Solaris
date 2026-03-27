// components/TermsModal.jsx
import React, { useState, useRef, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import './termsModal.css';

const TermsModal = ({ 
  isOpen, 
  onClose, 
  mode = 'simple',  // 'simple' or 'registration'
  onAccept, 
  title = "Terms and Conditions" 
}) => {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (isOpen && mode === 'registration') {
      setHasScrolledToBottom(false);
      setTermsAccepted(false);
    }
  }, [isOpen, mode]);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
      const isBottom = scrollTop + clientHeight >= scrollHeight - 10;
      if (isBottom && !hasScrolledToBottom) {
        setHasScrolledToBottom(true);
      }
    }
  };

  const handleAccept = () => {
    if (mode === 'registration' && !termsAccepted) return;
    if (onAccept) onAccept();
    onClose();
  };

  const handleClose = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay-terms" onClick={handleClose}>
      <div className="modal-content-terms" onClick={e => e.stopPropagation()}>
        <div className="modal-header-terms">
          <h2>{title}</h2>
          <button className="modal-close-terms" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div 
          className={`modal-body-terms ${mode === 'registration' ? 'registration-mode' : ''}`}
          ref={scrollRef}
          onScroll={mode === 'registration' ? handleScroll : undefined}
        >
          <div className="terms-scroll-terms">
            <h3>SOLARIS Solar Assessment and Planning System</h3>

            {/* 1. System Description */}
            <div className="terms-section-terms">
              <h4>1. System Description</h4>
              <p>SOLARIS is an Internet of Things based web and mobile platform designed to assist in the planning, assessment, and management of solar energy systems.</p>
              <p>The System may include the following services and features:</p>
              <ul>
                <li>Solar site pre-assessment scheduling.</li>
                <li>Deployment of IoT solar monitoring equipment.</li>
                <li>Solar irradiance and environmental data monitoring.</li>
                <li>Solar site efficiency computation and analysis.</li>
                <li>Solar system design and layout optimization.</li>
                <li>Estimated solar system sizing and cost quotation.</li>
                <li>Installation planning assistance.</li>
                <li>Transaction processing and service coordination.</li>
                <li>Generation of reports.</li>
              </ul>
              <p>The System provides feasibility analysis and planning support only and does not constitute final engineering approval or certified electrical design.</p>
            </div>

            {/* 2. User Accounts */}
            <div className="terms-section-terms">
              <h4>2. User Accounts</h4>
              <p>Users may be required to create an account in order to access certain services of the System.</p>
              <p>By creating an account the User agrees to:</p>
              <ul>
                <li>Provide accurate and complete information</li>
                <li>Maintain the confidentiality of account credentials</li>
                <li>Accept responsibility for all activities under their account</li>
              </ul>
              <p>The Service Provider reserves the right to suspend or terminate accounts that violate these Terms.</p>
            </div>

            {/* 3. Booking and Payment Policy */}
            <div className="terms-section-terms">
              <h4>3. Booking and Payment Policy</h4>
              <p>Certain services available through the System may require payment.</p>
              <p>Booking of services such as solar site pre-assessment is confirmed only after payment of the required assessment fee.</p>
              <p><strong>Assessment fee: ₱1,500.00</strong></p>
              <p>Payment must be completed prior to equipment deployment or service execution.</p>
              <p>The assessment fee may cover:</p>
              <ul>
                <li>Equipment usage</li>
                <li>Installation and retrieval</li>
                <li>Data collection and monitoring</li>
                <li>Data processing and analysis</li>
                <li>Report generation</li>
              </ul>
              <p>All payments processed through the System are considered final once the service deployment begins.</p>
            </div>

            {/* 4. Cancellation and Rescheduling Policy */}
            <div className="terms-section-terms">
              <h4>4. Cancellation and Rescheduling Policy</h4>
              <p><strong>A. Before Equipment Deployment</strong></p>
              <table className="terms-table-terms">
                <thead>
                  <tr><th>Timing of Cancellation</th><th>Refund Policy</th></tr></thead>
                <tbody>
                  <tr><td>72 or more hours before scheduled deployment</td><td>80% refund</td> </tr>
                  <tr><td>48 to 72 hours before scheduled deployment</td><td>50% refund</td> </tr>
                  <tr><td>Less than 48 hours before scheduled deployment</td><td>No refund</td> </tr>
                 
                </tbody>
              </table>
              <p>Processing fees are non refundable.</p>
              <p>Rescheduling may be allowed once without additional charge if requested at least 48 hours before the scheduled deployment.</p>

              <p><strong>B. During Monitoring Period</strong></p>
              <p>Monitoring typically runs for seven consecutive days unless otherwise specified.</p>
              <p>If the Client:</p>
              <ul>
                <li>Requests early removal of equipment</li>
                <li>Denies access to the installation site</li>
                <li>Interferes with monitoring equipment</li>
              </ul>
              <p>Then:</p>
              <ul>
                <li>No refund will be issued</li>
                <li>Partial data may still be analyzed</li>
                <li>A limited report may still be generated</li>
              </ul>
            </div>

            {/* 5. Weather and Environmental Conditions */}
            <div className="terms-section-terms">
              <h4>5. Weather and Environmental Conditions</h4>
              <p>Solar monitoring and data collection may be affected by environmental conditions including:</p>
              <ul>
                <li>Heavy rain</li>
                <li>Typhoons</li>
                <li>Extended cloud cover</li>
                <li>Extreme heat</li>
              </ul>
              <p>If three or more monitoring days are significantly affected by extreme weather conditions the Service Provider may:</p>
              <ul>
                <li>Extend monitoring days without additional cost OR</li>
                <li>Issue a report containing a weather condition disclaimer</li>
              </ul>
              <p>Weather conditions are not considered valid grounds for refund.</p>
            </div>

            {/* 6. Equipment Responsibility */}
            <div className="terms-section-terms">
              <h4>6. Equipment Responsibility</h4>
              <p>Clients agree to:</p>
              <ul>
                <li>Provide a safe and secure installation location</li>
                <li>Prevent tampering relocation or interference with equipment</li>
                <li>Protect the equipment from intentional damage</li>
              </ul>
              <p>If equipment is:</p>
              <ul>
                <li><strong>Damaged due to client negligence</strong> – the Client shall shoulder repair or replacement costs.</li>
                <li><strong>Stolen or vandalized</strong> within the Client property – the Client may be held responsible unless a police report is provided.</li>
                <li><strong>Damaged by natural disaster</strong> – liability will be assessed on a case by case basis.</li>
              </ul>
            </div>

            {/* 7. Power and Connectivity Interruptions */}
            <div className="terms-section-terms">
              <h4>7. Power and Connectivity Interruptions</h4>
              <p>The Service Provider is not liable for interruptions caused by:</p>
              <ul>
                <li>Power outages</li>
                <li>WiFi signal loss</li>
                <li>Network connectivity issues</li>
                <li>Uncontrollable technical failure</li>
              </ul>
              <p>If data loss exceeds thirty percent of the monitoring period monitoring may be extended or the report may include a data reliability disclaimer.</p>
            </div>

            {/* 8. Data Accuracy Disclaimer */}
            <div className="terms-section-terms">
              <h4>8. Data Accuracy Disclaimer</h4>
              <p>Reports generated by the System are based on:</p>
              <ul>
                <li>Measured solar irradiance</li>
                <li>Recorded ambient temperature</li>
                <li>Standard solar engineering formulas</li>
                <li>Data collected from IoT monitoring devices</li>
              </ul>
              <p>All reports and estimates:</p>
              <ul>
                <li>Are for planning and feasibility purposes only</li>
                <li>Do not guarantee future energy production</li>
                <li>Do not guarantee financial return or savings</li>
              </ul>
              <p>Changes in environmental conditions building structures or shading after monitoring may alter system performance.</p>
            </div>

            {/* 9. System Generated Designs and Layout Optimization */}
            <div className="terms-section-terms">
              <h4>9. System Generated Designs and Layout Optimization</h4>
              <p>Solar system designs layouts and sizing recommendations generated by the System are automated calculations based on collected data and standard solar engineering practices.</p>
              <p>These outputs:</p>
              <ul>
                <li>Are preliminary recommendations</li>
                <li>May require verification by a licensed engineer</li>
                <li>Should not be treated as final installation blueprints</li>
              </ul>
            </div>

            {/* 10. Estimated Quotations */}
            <div className="terms-section-terms">
              <h4>10. Estimated Quotations</h4>
              <p>Any quotation generated by the System:</p>
              <ul>
                <li>Is based on collected assessment data</li>
                <li>Is valid for thirty days unless otherwise specified</li>
                <li>May change based on final site inspection</li>
                <li>May change due to fluctuations in material and installation costs</li>
              </ul>
              <p>All quotations are preliminary and non-binding.</p>
            </div>

            {/* 11. No Obligation to Purchase */}
            <div className="terms-section-terms">
              <h4>11. No Obligation to Purchase</h4>
              <p>Clients are not obligated to proceed with solar installation after completing the assessment or using the System services.</p>
              <p>However assessment fees remain non refundable once monitoring deployment has begun.</p>
            </div>

            {/* 12. Limitation of Liability */}
            <div className="terms-section-terms">
              <h4>12. Limitation of Liability</h4>
              <p>The Service Provider shall not be liable for:</p>
              <ul>
                <li>Financial decisions made based on system generated reports</li>
                <li>Solar performance variations caused by weather or environmental changes</li>
                <li>Utility rate changes</li>
                <li>Structural changes after monitoring</li>
                <li>Acts of God or natural disasters</li>
                <li>Government regulations affecting solar installation</li>
              </ul>
              <p>Maximum liability shall not exceed the total assessment fee paid for the service.</p>
            </div>

            {/* 13. Force Majeure */}
            <div className="terms-section-terms">
              <h4>13. Force Majeure</h4>
              <p>The Service Provider shall not be held responsible for delays or failure to perform services due to events beyond reasonable control including:</p>
              <ul>
                <li>Natural disasters</li>
                <li>Government restrictions</li>
                <li>War or civil unrest</li>
                <li>Pandemics</li>
                <li>Severe weather conditions</li>
              </ul>
              <p>Service schedules may be adjusted accordingly.</p>
            </div>

            {/* 14. Data Privacy */}
            <div className="terms-section-terms">
              <h4>14. Data Privacy</h4>
              <p>The System may collect the following information:</p>
              <ul>
                <li>Solar irradiance data</li>
                <li>Temperature data</li>
                <li>Site location information</li>
                <li>Client contact information</li>
                <li>System usage data</li>
              </ul>
              <p>Collected data will only be used for:</p>
              <ul>
                <li>Solar feasibility analysis</li>
                <li>System report generation</li>
                <li>Service coordination</li>
              </ul>
              <p>All data that will be collected will only and strictly for the system process only.</p>
            </div>

            {/* 15. Dispute Resolution */}
            <div className="terms-section-terms">
              <h4>15. Dispute Resolution</h4>
              <p>All disputes arising from the use of the System shall first be resolved through mutual discussion between the Client and the Service Provider.</p>
              <p>If the dispute cannot be resolved amicably it shall be governed by the laws of the Republic of the Philippines.</p>
            </div>

            {/* 16. Agreement Confirmation */}
            <div className="terms-section-terms">
              <h4>16. Agreement Confirmation</h4>
              <p>By creating an account booking a service or making a payment through the System the User confirms that they:</p>
              <ul>
                <li>Have read and understood these Terms and Conditions</li>
                <li>Accept the service policies and limitations stated herein</li>
                <li>Agree to comply with all rules governing the use of the System</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="modal-footer-terms">
          {mode === 'registration' ? (
            <>
              <div className="terms-checkbox-wrapper">
                <input
                  type="checkbox"
                  id="terms-accept"
                  checked={termsAccepted}
                  disabled={!hasScrolledToBottom}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                <label htmlFor="terms-accept">
                  I have read and agree to the Terms and Conditions
                </label>
              </div>
              <button 
                className="btn-accept-terms"
                onClick={handleAccept}
                disabled={!termsAccepted}
              >
                Confirm & Continue
              </button>
            </>
          ) : (
            <button className="btn-close-terms" onClick={handleClose}>
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TermsModal;