// pages/Admin/SystemConfig.adsycon.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaDollarSign, 
  FaCalculator, 
  FaChartLine, 
  FaPercentage,
  FaCog,
  FaSave,
  FaHistory,
  FaUndo,
  FaSpinner,
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaWrench,
  FaChartBar,
  FaReceipt,
  FaArrowLeft,
  FaInfoCircle,
  FaTools,
  FaBoxes,
  FaBolt,
  FaBatteryFull
} from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';
import '../../styles/Admin/systemconfig.css';

const SystemConfig = () => {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState(null);
  const [activeTab, setActiveTab] = useState('prices');
  const [reason, setReason] = useState('');
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [pendingUpdates, setPendingUpdates] = useState(null);

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/maintenance/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data.config);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching config:', error);
      showToast('Failed to load configuration', 'error');
      setLoading(false);
    }
  };

  const handleSave = async (updates) => {
    setPendingUpdates(updates);
    setShowReasonModal(true);
  };

  const confirmSave = async () => {
    if (!reason.trim()) {
      showToast('Please enter a reason for the update', 'warning');
      return;
    }

    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${import.meta.env.VITE_API_URL}/api/maintenance/config?reason=${encodeURIComponent(reason)}`, 
        pendingUpdates,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Configuration updated successfully', 'success');
      setShowReasonModal(false);
      setReason('');
      fetchConfig();
    } catch (error) {
      console.error('Error saving config:', error);
      showToast('Failed to update configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      return;
    }
    
    const reasonReset = prompt('Please enter a reason for resetting:');
    if (!reasonReset) return;
    
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${import.meta.env.VITE_API_URL}/api/maintenance/config/reset`, 
        { reason: reasonReset },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Configuration reset to defaults', 'success');
      fetchConfig();
    } catch (error) {
      console.error('Error resetting config:', error);
      showToast('Failed to reset configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  const updateNestedValue = (path, value) => {
    const newConfig = { ...config };
    const keys = path.split('.');
    let current = newConfig;
    for (let i = 0; i < keys.length - 1; i++) {
      if (!current[keys[i]]) {
        current[keys[i]] = {};
      }
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;
    setConfig(newConfig);
  };

  // Skeleton Loader Component
  const SkeletonLoader = () => (
    <div className="system-config-container-adsycon">
      <div className="config-header-adsycon">
        <div className="skeleton-line-adsycon large-adsycon"></div>
        <div className="skeleton-line-adsycon medium-adsycon"></div>
        <div className="skeleton-button-adsycon"></div>
      </div>
      <div className="config-tabs-adsycon">
        <div className="skeleton-tab-adsycon"></div>
        <div className="skeleton-tab-adsycon"></div>
        <div className="skeleton-tab-adsycon"></div>
        <div className="skeleton-tab-adsycon"></div>
        <div className="skeleton-tab-adsycon"></div>
      </div>
      <div className="config-content-adsycon">
        <div className="config-section-adsycon skeleton-card-adsycon">
          <div className="skeleton-line-adsycon medium-adsycon"></div>
          <div className="skeleton-input-adsycon"></div>
          <div className="skeleton-input-adsycon"></div>
          <div className="skeleton-input-adsycon"></div>
          <div className="skeleton-button-adsycon"></div>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <>
        <Helmet>
          <title>System Configuration | Admin | Salfer Engineering</title>
        </Helmet>
        <SkeletonLoader />
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>System Configuration | Admin | Salfer Engineering</title>
      </Helmet>

      <div className="system-config-container-adsycon">
        <div className="config-header-adsycon">
          <div>
            <h1><FaCog /> System Configuration</h1>
            <p>Manage system parameters, prices, and calculation settings</p>
          </div>
          <div className="header-actions-adsycon">
            <button className="btn-reset-adsycon" onClick={handleReset} disabled={saving}>
              <FaUndo /> Reset to Defaults
            </button>
          </div>
        </div>

        <div className="config-tabs-adsycon">
          <button className={`tab-btn-adsycon ${activeTab === 'prices' ? 'active-adsycon' : ''}`} onClick={() => setActiveTab('prices')}>
            <FaMoneyBillWave /> Prices & Fees
          </button>
          <button className={`tab-btn-adsycon ${activeTab === 'calculations' ? 'active-adsycon' : ''}`} onClick={() => setActiveTab('calculations')}>
            <FaCalculator /> Calculations
          </button>
          <button className={`tab-btn-adsycon ${activeTab === 'financial' ? 'active-adsycon' : ''}`} onClick={() => setActiveTab('financial')}>
            <FaChartLine /> Financial
          </button>
          <button className={`tab-btn-adsycon ${activeTab === 'taxes' ? 'active-adsycon' : ''}`} onClick={() => setActiveTab('taxes')}>
            <FaPercentage /> Taxes & Fees
          </button>
          <button className={`tab-btn-adsycon ${activeTab === 'thresholds' ? 'active-adsycon' : ''}`} onClick={() => setActiveTab('thresholds')}>
            <FaChartBar /> Thresholds
          </button>
        </div>

        <div className="config-content-adsycon">
          {/* Prices & Fees Tab */}
          {activeTab === 'prices' && config && (
            <div className="config-section-adsycon">
              <h3><FaMoneyBillWave /> Assessment & Equipment Prices</h3>
              
              <div className="form-group-adsycon">
                <label>Pre-Assessment Fee</label>
                <div className="input-group-adsycon">
                  <span className="currency-adsycon">₱</span>
                  <input
                    type="number"
                    value={config.assessmentFee || 1500}
                    onChange={(e) => setConfig({ ...config, assessmentFee: parseFloat(e.target.value) })}
                  />
                </div>
              </div>

              <h4><FaBolt /> Solar Panel Prices</h4>
              <div className="form-group-adsycon">
                <label>Price per Watt (₱)</label>
                <input
                  type="number"
                  step="0.5"
                  value={config.equipmentPrices?.solarPanel?.pricePerWatt || 25}
                  onChange={(e) => updateNestedValue('equipmentPrices.solarPanel.pricePerWatt', parseFloat(e.target.value))}
                />
              </div>

              <h4><FaBolt /> Inverter Prices</h4>
              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Grid-Tie Inverter (₱)</label>
                  <input
                    type="number"
                    value={config.equipmentPrices?.inverter?.gridTie || 15000}
                    onChange={(e) => updateNestedValue('equipmentPrices.inverter.gridTie', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Hybrid Inverter (₱)</label>
                  <input
                    type="number"
                    value={config.equipmentPrices?.inverter?.hybrid || 25000}
                    onChange={(e) => updateNestedValue('equipmentPrices.inverter.hybrid', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Off-Grid Inverter (₱)</label>
                  <input
                    type="number"
                    value={config.equipmentPrices?.inverter?.offGrid || 20000}
                    onChange={(e) => updateNestedValue('equipmentPrices.inverter.offGrid', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <h4><FaBatteryFull /> Battery Prices</h4>
              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Lead Acid Battery (₱)</label>
                  <input
                    type="number"
                    value={config.equipmentPrices?.battery?.leadAcid || 8000}
                    onChange={(e) => updateNestedValue('equipmentPrices.battery.leadAcid', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Lithium Battery (₱)</label>
                  <input
                    type="number"
                    value={config.equipmentPrices?.battery?.lithium || 15000}
                    onChange={(e) => updateNestedValue('equipmentPrices.battery.lithium', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <h4><FaWrench /> Labor Rates</h4>
              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Per kW Installation (₱)</label>
                  <input
                    type="number"
                    value={config.laborRates?.perKw || 5000}
                    onChange={(e) => updateNestedValue('laborRates.perKw', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Per Panel Installation (₱)</label>
                  <input
                    type="number"
                    value={config.laborRates?.perPanel || 1000}
                    onChange={(e) => updateNestedValue('laborRates.perPanel', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Minimum Labor Fee (₱)</label>
                  <input
                    type="number"
                    value={config.laborRates?.minimumFee || 10000}
                    onChange={(e) => updateNestedValue('laborRates.minimumFee', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="config-actions-adsycon">
                <button className="btn-save-adsycon" onClick={() => handleSave({ assessmentFee: config.assessmentFee, equipmentPrices: config.equipmentPrices, laborRates: config.laborRates })}>
                  <FaSave /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Calculations Tab */}
          {activeTab === 'calculations' && config && (
            <div className="config-section-adsycon">
              <h3><FaCalculator /> System Calculation Parameters</h3>
              
              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Average Sun Hours (hours/day)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.systemCalculations?.averageSunHours || 4.5}
                    onChange={(e) => updateNestedValue('systemCalculations.averageSunHours', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>System Losses (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={((config.systemCalculations?.systemLosses || 0.2) * 100).toFixed(1)}
                    onChange={(e) => updateNestedValue('systemCalculations.systemLosses', parseFloat(e.target.value) / 100)}
                  />
                </div>
              </div>

              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Derating Factor</label>
                  <input
                    type="number"
                    step="0.01"
                    value={config.systemCalculations?.deratingFactor || 0.77}
                    onChange={(e) => updateNestedValue('systemCalculations.deratingFactor', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Panel Efficiency (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={((config.systemCalculations?.panelEfficiency || 0.18) * 100).toFixed(1)}
                    onChange={(e) => updateNestedValue('systemCalculations.panelEfficiency', parseFloat(e.target.value) / 100)}
                  />
                </div>
              </div>

              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Inverter Efficiency (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={((config.systemCalculations?.inverterEfficiency || 0.96) * 100).toFixed(1)}
                    onChange={(e) => updateNestedValue('systemCalculations.inverterEfficiency', parseFloat(e.target.value) / 100)}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Battery Efficiency (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={((config.systemCalculations?.batteryEfficiency || 0.85) * 100).toFixed(1)}
                    onChange={(e) => updateNestedValue('systemCalculations.batteryEfficiency', parseFloat(e.target.value) / 100)}
                  />
                </div>
              </div>

              <div className="config-actions-adsycon">
                <button className="btn-save-adsycon" onClick={() => handleSave({ systemCalculations: config.systemCalculations })}>
                  <FaSave /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Financial Tab */}
          {activeTab === 'financial' && config && (
            <div className="config-section-adsycon">
              <h3><FaChartLine /> Financial Parameters</h3>
              
              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Electricity Rate (₱/kWh)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={config.financialParams?.electricityRate || 11.5}
                    onChange={(e) => updateNestedValue('financialParams.electricityRate', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Inflation Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={((config.financialParams?.inflationRate || 0.03) * 100).toFixed(1)}
                    onChange={(e) => updateNestedValue('financialParams.inflationRate', parseFloat(e.target.value) / 100)}
                  />
                </div>
              </div>

              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Discount Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={((config.financialParams?.discountRate || 0.08) * 100).toFixed(1)}
                    onChange={(e) => updateNestedValue('financialParams.discountRate', parseFloat(e.target.value) / 100)}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>System Lifespan (years)</label>
                  <input
                    type="number"
                    value={config.financialParams?.systemLifespan || 25}
                    onChange={(e) => updateNestedValue('financialParams.systemLifespan', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Warranty Period (years)</label>
                  <input
                    type="number"
                    value={config.financialParams?.warrantyPeriod || 10}
                    onChange={(e) => updateNestedValue('financialParams.warrantyPeriod', parseInt(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Payback Target (years)</label>
                  <input
                    type="number"
                    value={config.financialParams?.paybackTargetYears || 7}
                    onChange={(e) => updateNestedValue('financialParams.paybackTargetYears', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <div className="config-actions-adsycon">
                <button className="btn-save-adsycon" onClick={() => handleSave({ financialParams: config.financialParams })}>
                  <FaSave /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Taxes & Fees Tab */}
          {activeTab === 'taxes' && config && (
            <div className="config-section-adsycon">
              <h3><FaPercentage /> Taxes and Additional Fees</h3>
              
              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>VAT Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={((config.taxesAndFees?.vatRate || 0.12) * 100).toFixed(1)}
                    onChange={(e) => updateNestedValue('taxesAndFees.vatRate', parseFloat(e.target.value) / 100)}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Withholding Tax (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={((config.taxesAndFees?.withholdingTax || 0.01) * 100).toFixed(1)}
                    onChange={(e) => updateNestedValue('taxesAndFees.withholdingTax', parseFloat(e.target.value) / 100)}
                  />
                </div>
              </div>

              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Permit Fee (₱)</label>
                  <input
                    type="number"
                    value={config.taxesAndFees?.permitFee || 3000}
                    onChange={(e) => updateNestedValue('taxesAndFees.permitFee', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Net Metering Fee (₱)</label>
                  <input
                    type="number"
                    value={config.taxesAndFees?.netMeteringFee || 5000}
                    onChange={(e) => updateNestedValue('taxesAndFees.netMeteringFee', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="config-actions-adsycon">
                <button className="btn-save-adsycon" onClick={() => handleSave({ taxesAndFees: config.taxesAndFees })}>
                  <FaSave /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Thresholds Tab */}
          {activeTab === 'thresholds' && config && (
            <div className="config-section-adsycon">
              <h3><FaChartBar /> System Size Thresholds (kW)</h3>
              
              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Small System (≤ kW)</label>
                  <input
                    type="number"
                    value={config.thresholds?.smallSystem || 3}
                    onChange={(e) => updateNestedValue('thresholds.smallSystem', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Medium System (≤ kW)</label>
                  <input
                    type="number"
                    value={config.thresholds?.mediumSystem || 7}
                    onChange={(e) => updateNestedValue('thresholds.mediumSystem', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-row-adsycon">
                <div className="form-group-adsycon">
                  <label>Large System (≤ kW)</label>
                  <input
                    type="number"
                    value={config.thresholds?.largeSystem || 12}
                    onChange={(e) => updateNestedValue('thresholds.largeSystem', parseFloat(e.target.value))}
                  />
                </div>
                <div className="form-group-adsycon">
                  <label>Max Recommended System (kW)</label>
                  <input
                    type="number"
                    value={config.thresholds?.maxRecommendedSystem || 50}
                    onChange={(e) => updateNestedValue('thresholds.maxRecommendedSystem', parseFloat(e.target.value))}
                  />
                </div>
              </div>

              <div className="config-actions-adsycon">
                <button className="btn-save-adsycon" onClick={() => handleSave({ thresholds: config.thresholds })}>
                  <FaSave /> Save Changes
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Reason Modal */}
        {showReasonModal && (
          <div className="modal-overlay-adsycon" onClick={() => setShowReasonModal(false)}>
            <div className="modal-content-adsycon" onClick={e => e.stopPropagation()}>
              <h3>Reason for Update</h3>
              <p>Please provide a reason for these configuration changes:</p>
              <textarea
                rows="3"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Price adjustment due to market changes, Updated calculation parameters, etc."
              />
              <div className="modal-actions-adsycon">
                <button className="btn-cancel-adsycon" onClick={() => setShowReasonModal(false)}>Cancel</button>
                <button className="btn-confirm-adsycon" onClick={confirmSave} disabled={saving}>
                  {saving ? <FaSpinner className="spinner-adsycon" /> : <FaCheckCircle />} Confirm Update
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

export default SystemConfig;