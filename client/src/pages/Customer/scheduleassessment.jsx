import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ScheduleAssessment = () => {
  // Step tracking: 'form' | 'payment' | 'confirmation'
  const [currentStep, setCurrentStep] = useState('form');

  // User authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Estimator state
  const [estimatorData, setEstimatorData] = useState({
    monthlyBill: '',
    electricityRate: '11.50', // Default PH rate
    averageSunHours: '5', // Default PH average
    systemType: 'grid-tie',
    usagePattern: 'daytime'
  });

  const [estimationResult, setEstimationResult] = useState(null);

  // Booking form state
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    contactNumber: '',
    address: '',
    propertyType: 'residential',
    desiredCapacity: '',
    roofType: '',
    preferredDate: ''
  });

  // Terms and confirmation state
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Payment state
  const [paymentMethod, setPaymentMethod] = useState(''); // 'gcash' | 'cash'
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('pending'); // 'pending' | 'forVerification' | 'paid'

  // Invoice/Booking data from system
  const [bookingData, setBookingData] = useState({
    bookingId: null,
    assessmentFee: 1500, // Example fee
    invoiceNumber: null
  });

  // Fetch client data on component mount
  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
  try {
    setLoading(true);
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      setError('Please log in to book an assessment');
      setLoading(false);
      return;
    }

    const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/clients/me`, {
      headers: { Authorization: `Bearer ${token}` }
    });


    // Based on your backend: res.json({ client })
    const clientData = response.data?.client;

    if (!clientData) {
      console.error('No client data in response:', response.data);
      setError('Client profile not found. Please complete your profile first.');
      setLoading(false);
      return;
    }
    
    setUser(clientData);

    // Safely extract name fields with fallbacks
    const firstName = clientData?.contactFirstName || '';
    const middleName = clientData?.contactMiddleName || '';
    const lastName = clientData?.contactLastName || '';
    
    // Construct full name, handling empty parts
    const fullName = [firstName, middleName, lastName]
      .filter(part => part && part.trim() !== '')
      .join(' ');

    // Get email from the client data (now populated from users table)
    const email = clientData?.email || '';

    // Handle address - could be string or object
    let addressString = '';
    if (clientData?.address) {
      if (typeof clientData.address === 'string') {
        addressString = clientData.address;
      } else if (typeof clientData.address === 'object') {
        // Handle address object structure
        const addr = clientData.address;
        const addressParts = [];
        
        // Common address fields in your schema
        if (addr.street) addressParts.push(addr.street);
        if (addr.barangay) addressParts.push(addr.barangay);
        if (addr.city) addressParts.push(addr.city);
        if (addr.province) addressParts.push(addr.province);
        if (addr.zipCode) addressParts.push(addr.zipCode);
        
        addressString = addressParts.filter(Boolean).join(', ');
      }
    }

    

    // Pre-fill form with client data (including email)
    setFormData(prev => ({
      ...prev,
      fullName: fullName || prev.fullName,
      email: email || prev.email, // Now email comes from the populated user data
      contactNumber: clientData?.contactNumber || prev.contactNumber,
      address: addressString || prev.address
    }));

  } catch (err) {
    console.error('Error fetching client data:', err);
    console.error('Error response:', err.response?.data);
    console.error('Error status:', err.response?.status);
    
    if (err.response?.status === 401) {
      setError('Your session has expired. Please log in again.');
    } else if (err.response?.status === 404) {
      setError('Client profile not found. Please complete your profile first.');
    } else {
      setError(err.response?.data?.message || 'Failed to load client information. Please try again.');
    }
  } finally {
    setLoading(false);
  }
};

  const handleEstimatorChange = (e) => {
    const { name, value } = e.target;
    setEstimatorData(prev => ({ ...prev, [name]: value }));
  };

  const calculateSavings = () => {
    const monthlyBill = parseFloat(estimatorData.monthlyBill) || 0;
    const rate = parseFloat(estimatorData.electricityRate) || 11.50;
    const sunHours = parseFloat(estimatorData.averageSunHours) || 5;
    const systemType = estimatorData.systemType;
    const usagePattern = estimatorData.usagePattern;

    // Calculate monthly consumption (kWh)
    const monthlyConsumption = monthlyBill / rate;

    // Daily consumption
    const dailyConsumption = monthlyConsumption / 30;

    // Recommended system size (kW)
    let recommendedSize = dailyConsumption / sunHours;

    // Round to nearest 0.5kW
    recommendedSize = Math.ceil(recommendedSize * 2) / 2;

    // Adjust based on usage pattern
    let selfConsumptionRatio = usagePattern === 'daytime' ? 0.8 : 0.4;
    let exportRatio = usagePattern === 'daytime' ? 0.2 : 0.6;

    // System type factors
    let systemCostPerKw = 0;
    let batteryCost = 0;
    let systemEfficiency = 0;
    let systemDescription = '';

    switch (systemType) {
      case 'grid-tie':
        systemCostPerKw = 70000;
        batteryCost = 0;
        systemEfficiency = 0.85;
        systemDescription = 'Grid-tied (No battery, net metering)';
        break;
      case 'hybrid':
        systemCostPerKw = 75000;
        batteryCost = 120000;
        systemEfficiency = 0.9;
        systemDescription = 'Hybrid (With battery backup, grid-connected)';
        break;
      case 'off-grid':
        systemCostPerKw = 80000;
        batteryCost = 200000;
        systemEfficiency = 0.8;
        systemDescription = 'Off-grid (Completely independent, with batteries)';
        break;
      default:
        systemCostPerKw = 70000;
        batteryCost = 0;
        systemEfficiency = 0.85;
    }

    // Calculate system costs
    const systemCost = recommendedSize * systemCostPerKw;
    const totalSystemCost = systemCost + batteryCost;

    // Daily energy production (kWh)
    const dailyProduction = recommendedSize * sunHours * systemEfficiency;
    const monthlyProduction = dailyProduction * 30;

    // Savings calculation
    const selfConsumedEnergy = monthlyProduction * selfConsumptionRatio;
    const selfConsumptionSavings = selfConsumedEnergy * rate;

    const exportRate = systemType === 'grid-tie' ? rate * 0.7 : 0;
    const exportedEnergy = monthlyProduction * exportRatio;
    const exportSavings = exportedEnergy * exportRate;

    // Total monthly savings
    const estimatedMonthlySavings = selfConsumptionSavings + exportSavings;

    // Grid dependency
    const gridDependency = Math.max(0, ((monthlyConsumption - monthlyProduction) / monthlyConsumption * 100)).toFixed(1);

    // Payback period (years)
    const annualSavings = estimatedMonthlySavings * 12;
    const paybackPeriod = totalSystemCost / annualSavings;

    // CO2 offset per year
    const co2PerKwh = 0.7;
    const annualProduction = monthlyProduction * 12;
    const co2OffsetPerYear = Math.round(annualProduction * co2PerKwh);

    // 25 year total savings with inflation adjustment
    let cumulativeSavings = 0;
    for (let year = 1; year <= 25; year++) {
      cumulativeSavings += annualSavings * Math.pow(1.03, year - 1);
    }
    const total25YearSavingsWithInflation = Math.round(cumulativeSavings);

    // Panels needed
    const panelsNeeded = Math.ceil(recommendedSize * 1000 / 400);
    const roofSpaceNeeded = panelsNeeded * 2;

    setEstimationResult({
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
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitClick = (e) => {
    e.preventDefault();
    setShowConfirmDialog(true);
  };

  const handleConfirmBooking = async () => {
    if (!termsAccepted) {
      alert('Please accept the terms and conditions to proceed');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = sessionStorage.getItem('token');

      // Prepare booking data
      const bookingPayload = {
        ...formData,
        estimatorData,
        estimationResult,
        userId: user?.userId || user?._id
      };

      const response = await axios.post('/api/bookings', bookingPayload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setBookingData({
        bookingId: response.data.bookingId || 'BK-2024-001',
        assessmentFee: 1500,
        invoiceNumber: response.data.invoiceNumber || 'INV-2024-001'
      });

      setShowConfirmDialog(false);
      setTermsAccepted(false);
      setCurrentStep('payment');
    } catch (err) {
      console.error('Error submitting booking:', err);
      alert(err.response?.data?.message || 'Failed to submit booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setTermsAccepted(false);
  };

  const handleFileUpload = (e) => {
    setPaymentProof(e.target.files[0]);
  };

  const handlePaymentSubmit = () => {
    setPaymentStatus('forVerification');
    setCurrentStep('confirmation');
  };

  const handleCashPayment = () => {
    setCurrentStep('confirmation');
  };

  // Format currency
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  // Format number with commas
  const formatNumber = (value) => {
    return new Intl.NumberFormat('en-PH').format(value);
  };

  if (loading) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '50px',
        fontSize: '18px',
        color: '#666'
      }}>
        <div style={{ marginBottom: '20px' }}>Loading your information...</div>
        <div className="spinner" style={{
          border: '4px solid #f3f3f3',
          borderTop: '4px solid #007bff',
          borderRadius: '50%',
          width: '40px',
          height: '40px',
          animation: 'spin 1s linear infinite',
          margin: '0 auto'
        }}></div>
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '50px',
        maxWidth: '400px',
        margin: '0 auto'
      }}>
        <div style={{
          color: '#dc3545',
          fontSize: '24px',
          marginBottom: '20px'
        }}>
          ⚠️ Error
        </div>
        <p style={{
          color: '#666',
          marginBottom: '30px',
          fontSize: '16px'
        }}>
          {error}
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={fetchClientData}
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Try Again
          </button>
          <button
            onClick={() => window.location.href = '/login'}
            style={{
              padding: '10px 20px',
              backgroundColor: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // Step 1: Booking Form
  if (currentStep === 'form') {
    return (
      <div>
        <h1>Book Your Free Assessment</h1>

        {/* Confirmation Dialog Modal */}
        {showConfirmDialog && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '30px',
              borderRadius: '8px',
              maxWidth: '500px',
              width: '90%'
            }}>
              <h2 style={{ marginTop: 0, color: '#007bff' }}>Confirm Booking</h2>

              <div style={{ marginBottom: '20px' }}>
                <p><strong>Are you sure you want to proceed with this booking?</strong></p>
                <p>Please review your details:</p>
                <ul style={{ listStyle: 'none', padding: 0 }}>
                  <li><strong>Name:</strong> {formData.fullName || 'Not provided'}</li>
                  <li><strong>Email:</strong> {formData.email || 'Not provided'}</li>
                  <li><strong>Contact:</strong> {formData.contactNumber || 'Not provided'}</li>
                  <li><strong>Preferred Date:</strong> {formData.preferredDate || 'Not provided'}</li>
                  <li><strong>Assessment Fee:</strong> ₱1,500.00</li>
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                  />
                  <span>
                    I have read and agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms and Conditions</a> and
                    <a href="/privacy" target="_blank" rel="noopener noreferrer"> Privacy Policy</a>
                  </span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={handleCancelConfirm}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmBooking}
                  disabled={!termsAccepted || isSubmitting}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: termsAccepted && !isSubmitting ? 'pointer' : 'not-allowed',
                    opacity: termsAccepted && !isSubmitting ? 1 : 0.6
                  }}
                >
                  {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Quick Savings Estimator */}
        <div style={{ marginBottom: '30px', padding: '20px', border: '2px solid #007bff', borderRadius: '5px' }}>
          <h3 style={{ marginTop: 0 }}>Solar Savings Estimator</h3>
          <p><small>Enter your details below for a personalized estimate</small></p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '15px' }}>
            <div>
              <label><strong>Monthly Electricity Bill (₱)</strong></label><br />
              <input
                type="number"
                name="monthlyBill"
                value={estimatorData.monthlyBill}
                onChange={handleEstimatorChange}
                placeholder="e.g., 5000"
                style={{ width: '90%', padding: '8px' }} />
            </div>

            <div>
              <label><strong>Electricity Rate (₱/kWh)</strong></label><br />
              <input
                type="number"
                name="electricityRate"
                value={estimatorData.electricityRate}
                onChange={handleEstimatorChange}
                placeholder="e.g., 11.50"
                step="0.1"
                style={{ width: '90%', padding: '8px' }} />
              <small>Meralco avg: ₱11.50/kWh</small>
            </div>

            <div>
              <label><strong>Average Sun Hours (per day)</strong></label><br />
              <input
                type="number"
                name="averageSunHours"
                value={estimatorData.averageSunHours}
                onChange={handleEstimatorChange}
                placeholder="e.g., 5"
                step="0.5"
                style={{ width: '90%', padding: '8px' }} />
              <small>PH average: 5-6 hours</small>
            </div>

            <div>
              <label><strong>System Type</strong></label><br />
              <select
                name="systemType"
                value={estimatorData.systemType}
                onChange={handleEstimatorChange}
                style={{ width: '95%', padding: '8px' }}
              >
                <option value="grid-tie">Grid-tie (No battery, net metering)</option>
                <option value="hybrid">Hybrid (With battery backup)</option>
                <option value="off-grid">Off-grid (Complete independence)</option>
              </select>
            </div>

            <div>
              <label><strong>Usage Pattern</strong></label><br />
              <select
                name="usagePattern"
                value={estimatorData.usagePattern}
                onChange={handleEstimatorChange}
                style={{ width: '95%', padding: '8px' }}
              >
                <option value="daytime">Mostly Daytime (home during day)</option>
                <option value="nighttime">Mostly Nighttime (work during day)</option>
                <option value="mixed">Mixed (balanced usage)</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button
                onClick={calculateSavings}
                disabled={!estimatorData.monthlyBill}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: estimatorData.monthlyBill ? 'pointer' : 'not-allowed',
                  opacity: estimatorData.monthlyBill ? 1 : 0.6
                }}
              >
                Calculate Savings
              </button>
            </div>
          </div>

          {/* Estimation Results */}
          {estimationResult && (
            <div style={{ marginTop: '20px', padding: '15px', background: '#e8f4fd', borderRadius: '5px' }}>
              <h4 style={{ marginTop: 0, color: '#007bff' }}>📊 Your Personalized Solar Estimate</h4>

              {/* System Overview */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '15px',
                marginBottom: '20px',
                padding: '15px',
                background: 'white',
                borderRadius: '5px'
              }}>
                <div>
                  <strong>Recommended System</strong>
                  <p style={{ fontSize: '28px', margin: '5px 0', color: '#007bff' }}>
                    {estimationResult.recommendedSize} kW
                  </p>
                  <small>{estimationResult.systemDescription}</small>
                </div>

                <div>
                  <strong>Estimated Monthly Savings</strong>
                  <p style={{ fontSize: '24px', margin: '5px 0', color: '#28a745' }}>
                    {formatCurrency(estimationResult.estimatedMonthlySavings)}
                  </p>
                  <small>{estimationResult.selfConsumptionRatio.toFixed(0)}% self-consumed</small>
                </div>

                <div>
                  <strong>System Cost (Estimate)</strong>
                  <p style={{ fontSize: '20px', margin: '5px 0' }}>
                    {formatCurrency(estimationResult.systemCost)}
                  </p>
                  <small>{estimationResult.panelsNeeded} panels • {estimationResult.roofSpaceNeeded} sqm</small>
                </div>

                <div>
                  <strong>Grid Dependency</strong>
                  <p style={{ fontSize: '20px', margin: '5px 0' }}>
                    {estimationResult.gridDependency}%
                  </p>
                  <small>Remaining from grid</small>
                </div>
              </div>

              {/* Key Metrics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                <div style={{ padding: '10px', background: 'white', borderRadius: '5px' }}>
                  <strong>💰 Estimated Payback Period</strong>
                  <p style={{ fontSize: '22px', margin: '5px 0' }}>{estimationResult.paybackPeriod} years</p>
                  <small>Based on {formatCurrency(estimationResult.annualSavings)} annual savings</small>
                </div>

                <div style={{ padding: '10px', background: 'white', borderRadius: '5px' }}>
                  <strong>🌱 CO₂ Offset Per Year</strong>
                  <p style={{ fontSize: '22px', margin: '5px 0' }}>{formatNumber(estimationResult.co2OffsetPerYear)} kg</p>
                  <small>Equivalent to planting {Math.round(estimationResult.co2OffsetPerYear / 20)} trees</small>
                </div>

                <div style={{ padding: '10px', background: 'white', borderRadius: '5px' }}>
                  <strong>⏱️ 25-Year Total Savings</strong>
                  <p style={{ fontSize: '22px', margin: '5px 0', color: '#28a745' }}>
                    {formatCurrency(estimationResult.total25YearSavings)}
                  </p>
                  <small>With 3% annual inflation adjustment</small>
                </div>
              </div>

              {/* Production Details */}
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: 'white',
                borderRadius: '5px',
                fontSize: '14px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)'
              }}>
                <div>
                  <strong>Daily Production:</strong> {estimationResult.dailyProduction} kWh
                </div>
                <div>
                  <strong>Monthly Production:</strong> {formatNumber(estimationResult.monthlyProduction)} kWh
                </div>
                <div>
                  <strong>Monthly Consumption:</strong> {formatNumber(estimationResult.monthlyConsumption)} kWh
                </div>
              </div>

              <p style={{ marginTop: '15px', marginBottom: 0, fontSize: '12px', color: '#666' }}>
                *This is a preliminary estimate. Actual savings may vary based on site conditions,
                installation factors, and future rate changes. Book a formal assessment for accurate recommendations.
              </p>
            </div>
          )}
        </div>

        <h2>Book Your Site Assessment</h2>
        <form onSubmit={handleSubmitClick}>
          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="fullName">Full Name *</label><br />
            <input
              type="text"
              id="fullName"
              name="fullName"
              value={formData.fullName}
              onChange={handleInputChange}
              required
              style={{ width: '300px', padding: '8px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="email">Email Address *</label><br />
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              style={{ width: '300px', padding: '8px' }} />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="contactNumber">Contact Number *</label><br />
            <input
              type="tel"
              id="contactNumber"
              name="contactNumber"
              value={formData.contactNumber}
              onChange={handleInputChange}
              required
              style={{ width: '300px', padding: '8px' }}
              placeholder="0917xxxxxxx" />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="address">Complete Address *</label><br />
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              style={{ width: '300px', padding: '8px' }}
              rows="3" />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="propertyType">Property Type *</label><br />
            <select
              id="propertyType"
              name="propertyType"
              value={formData.propertyType}
              onChange={handleInputChange}
              style={{ width: '320px', padding: '8px' }}
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="desiredCapacity">Desired Capacity (kW) - Optional</label><br />
            <input
              type="text"
              id="desiredCapacity"
              name="desiredCapacity"
              value={formData.desiredCapacity}
              onChange={handleInputChange}
              style={{ width: '300px', padding: '8px' }}
              placeholder="e.g., 5kW" />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label htmlFor="roofType">Roof Type - Optional</label><br />
            <select
              id="roofType"
              name="roofType"
              value={formData.roofType}
              onChange={handleInputChange}
              style={{ width: '320px', padding: '8px' }}
            >
              <option value="">Select roof type</option>
              <option value="concrete">Concrete</option>
              <option value="metal">Metal</option>
              <option value="tile">Tile</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="preferredDate">Preferred Start Date *</label><br />
            <input
              type="date"
              id="preferredDate"
              name="preferredDate"
              value={formData.preferredDate}
              onChange={handleInputChange}
              required
              style={{ width: '300px', padding: '8px' }} />
          </div>

          {/* Fee Display */}
          <div style={{ marginBottom: '20px', padding: '10px', background: '#f5f5f5' }}>
            <strong>Assessment Fee: ₱1,500.00</strong>
            <p><small>Non-refundable fee for 7-day monitoring</small></p>
          </div>

          <button
            type="submit"
            style={{
              padding: '10px 20px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Submit Booking Request
          </button>
        </form>
      </div>
    );
  }

  // Step 2: Payment Processing
  if (currentStep === 'payment') {
    return (
      <div>
        <h1>Complete Your Payment</h1>

        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
          <h3>Booking Summary</h3>
          <p><strong>Booking ID:</strong> {bookingData.bookingId}</p>
          <p><strong>Invoice:</strong> {bookingData.invoiceNumber}</p>
          <p><strong>Amount Due:</strong> ₱{bookingData.assessmentFee}.00</p>
          <p><strong>Status:</strong> Pending Payment</p>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Select Payment Method</h3>

          {/* GCash Option */}
          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc' }}>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="gcash"
                checked={paymentMethod === 'gcash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <strong> GCash</strong>
            </label>

            {paymentMethod === 'gcash' && (
              <div style={{ marginTop: '15px', marginLeft: '25px' }}>
                <div style={{ marginBottom: '10px' }}>
                  <p><strong>GCash Payment Details:</strong></p>
                  <p>Number: 0917XXXXXXX</p>
                  <p>Name: SOLARIS CORP</p>
                  <p>Amount: ₱{bookingData.assessmentFee}.00</p>
                </div>

                <div>
                  <label htmlFor="proof">Upload Payment Screenshot/Reference *</label><br />
                  <input
                    type="file"
                    id="proof"
                    accept="image/*"
                    onChange={handleFileUpload}
                    required
                  />
                  {paymentProof && <p>File selected: {paymentProof.name}</p>}
                </div>

                <button
                  onClick={handlePaymentSubmit}
                  disabled={!paymentProof}
                  style={{ marginTop: '10px', padding: '8px 15px' }}
                >
                  Submit Proof of Payment
                </button>
              </div>
            )}
          </div>

          {/* Cash Option */}
          <div style={{ marginBottom: '15px', padding: '10px', border: '1px solid #ccc' }}>
            <label>
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={paymentMethod === 'cash'}
                onChange={(e) => setPaymentMethod(e.target.value)}
              />
              <strong> Cash (Walk-in Payment)</strong>
            </label>

            {paymentMethod === 'cash' && (
              <div style={{ marginTop: '15px', marginLeft: '25px' }}>
                <p>Please visit our office to pay the assessment fee:</p>
                <p><strong>Address:</strong> SOLARIS Office, Unit 123, Building Name, City</p>
                <p><strong>Office Hours:</strong> Mon-Fri, 9AM-6PM</p>
                <p><strong>Amount to Pay:</strong> ₱{bookingData.assessmentFee}.00</p>
                <p><small>Your booking will be confirmed once payment is received.</small></p>

                <button
                  onClick={handleCashPayment}
                  style={{ padding: '8px 15px' }}
                >
                  I Understand, Proceed
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Confirmation
  if (currentStep === 'confirmation') {
    return (
      <div>
        <h1>Booking {paymentStatus === 'paid' ? 'Confirmed!' : 'Received!'}</h1>

        <div style={{ marginBottom: '20px', padding: '15px', border: '1px solid #ccc' }}>
          <p><strong>Booking ID:</strong> {bookingData.bookingId}</p>
          <p><strong>Invoice:</strong> {bookingData.invoiceNumber}</p>

          {paymentMethod === 'gcash' && paymentStatus === 'forVerification' && (
            <div>
              <p><strong>Payment Status:</strong> For Verification</p>
              <p>Your proof of payment is being verified. You'll receive a confirmation email once verified.</p>
            </div>
          )}

          {paymentMethod === 'cash' && (
            <div>
              <p><strong>Payment Status:</strong> Pending Cash Payment</p>
              <p>Please visit our office to complete your payment. Your booking will be confirmed upon payment.</p>
            </div>
          )}

          {paymentStatus === 'paid' && (
            <div>
              <p><strong>Payment Status:</strong> Paid</p>
              <p><strong>Booking Status:</strong> Confirmed</p>
              <p>Your 7-day assessment is scheduled to start on {formData.preferredDate}.</p>
            </div>
          )}
        </div>

        <div>
          <h3>Next Steps:</h3>
          <ul>
            <li>An engineer will be assigned to your site</li>
            <li>IoT device will be deployed for 7-day monitoring</li>
            <li>You'll receive updates via email/SMS</li>
          </ul>
        </div>

        <button onClick={() => setCurrentStep('form')} style={{ padding: '10px 20px' }}>
          Book Another Assessment
        </button>
      </div>
    );
  }
};

export default ScheduleAssessment;