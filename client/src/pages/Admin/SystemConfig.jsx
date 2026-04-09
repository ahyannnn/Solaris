// pages/Admin/SystemConfig.adsycon.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import { 
  FaSpinner,
  FaCheckCircle,
  FaSave,
  FaUndo,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaSolarPanel,
  FaBolt,
  FaBatteryFull,
  FaTools,
  FaPlug,
  FaWrench,
  FaHardHat,
  FaBox,
  FaPowerOff,
  FaChartLine
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
  
  // Equipment modal states
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [equipmentType, setEquipmentType] = useState('');
  const [editingItem, setEditingItem] = useState(null);
  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    price: 0,
    brand: '',
    warranty: 0,
    unit: 'piece',
    notes: ''
  });

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

  // Equipment Management Functions
  const openAddModal = (type) => {
    setEquipmentType(type);
    setEditingItem(null);
    setEquipmentForm({
      name: '',
      price: 0,
      brand: '',
      warranty: 0,
      unit: 'piece',
      notes: ''
    });
    setShowEquipmentModal(true);
  };

  const openEditModal = (type, item) => {
    setEquipmentType(type);
    setEditingItem(item);
    setEquipmentForm({
      name: item.name || '',
      price: item.price || 0,
      brand: item.brand || '',
      warranty: item.warranty || 0,
      unit: item.unit || 'piece',
      notes: item.notes || ''
    });
    setShowEquipmentModal(true);
  };

  const handleAddEquipment = async () => {
    if (!equipmentForm.name || equipmentForm.price <= 0) {
      showToast('Please enter name and valid price', 'warning');
      return;
    }

    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      const reasonText = prompt('Reason for adding this item:', `Added new ${equipmentType.slice(0, -1)}: ${equipmentForm.name}`);
      
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/maintenance/config/equipment?reason=${encodeURIComponent(reasonText || 'Added new equipment')}`,
        { 
          type: equipmentType, 
          ...equipmentForm 
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(response.data.message, 'success');
      setShowEquipmentModal(false);
      fetchConfig();
    } catch (error) {
      console.error('Error adding equipment:', error);
      showToast(error.response?.data?.message || 'Failed to add equipment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateEquipment = async () => {
    if (!equipmentForm.name || equipmentForm.price <= 0) {
      showToast('Please enter name and valid price', 'warning');
      return;
    }

    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      const reasonText = prompt('Reason for updating this item:', `Updated ${equipmentType.slice(0, -1)}: ${equipmentForm.name}`);
      
      const response = await axios.put(
        `${import.meta.env.VITE_API_URL}/api/maintenance/config/equipment/${equipmentType}/${editingItem._id}?reason=${encodeURIComponent(reasonText || 'Updated equipment')}`,
        equipmentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      showToast(response.data.message, 'success');
      setShowEquipmentModal(false);
      fetchConfig();
    } catch (error) {
      console.error('Error updating equipment:', error);
      showToast(error.response?.data?.message || 'Failed to update equipment', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveEquipment = async (type, item) => {
    if (!window.confirm(`Are you sure you want to remove "${item.name}"? This will hide it from selection.`)) {
      return;
    }
    
    setSaving(true);
    try {
      const token = sessionStorage.getItem('token');
      const reasonText = prompt('Reason for removing this item:', `Removed ${type.slice(0, -1)}: ${item.name}`);
      
      const response = await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/maintenance/config/equipment/${type}/${item._id}`,
        { 
          headers: { Authorization: `Bearer ${token}` },
          data: { reason: reasonText || 'Removed equipment' }
        }
      );
      
      showToast(response.data.message, 'success');
      fetchConfig();
    } catch (error) {
      console.error('Error removing equipment:', error);
      showToast(error.response?.data?.message || 'Failed to remove equipment', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Equipment Card Component
  const EquipmentCard = ({ item, type, onEdit, onRemove }) => {
    const getIcon = () => {
      switch(type) {
        case 'solarPanels': return <FaSolarPanel />;
        case 'inverters': return <FaBolt />;
        case 'batteries': return <FaBatteryFull />;
        case 'mountingStructures': return <FaTools />;
        case 'electricalComponents': return <FaPlug />;
        case 'cablesAndWiring': return <FaWrench />;
        case 'safetyEquipment': return <FaHardHat />;
        case 'junctionBoxes': return <FaBox />;
        case 'disconnectSwitches': return <FaPowerOff />;
        case 'meters': return <FaChartLine />;
        default: return <FaTools />;
      }
    };

    return (
      <div className="equipment-card-adsycon">
        <div className="equipment-icon-adsycon">{getIcon()}</div>
        <div className="equipment-info-adsycon">
          <div className="equipment-name-adsycon">{item.name}</div>
          <div className="equipment-details-adsycon">
            <span className="price-adsycon">₱{item.price.toLocaleString()}</span>
            {item.unit && <span className="unit-adsycon">per {item.unit}</span>}
            {item.brand && <span className="brand-adsycon">{item.brand}</span>}
            {item.warranty > 0 && <span className="warranty-adsycon">{item.warranty} yrs</span>}
          </div>
          {item.notes && <div className="equipment-notes-adsycon">{item.notes}</div>}
        </div>
        <div className="equipment-actions-adsycon">
          <button className="btn-edit-equipment-adsycon" onClick={() => onEdit(type, item)}>
            <FaEdit /> Edit
          </button>
          <button className="btn-remove-equipment-adsycon" onClick={() => onRemove(type, item)}>
            <FaTrash /> Remove
          </button>
        </div>
      </div>
    );
  };

  // Equipment Section Component
  const EquipmentSection = ({ title, type, icon: Icon, items }) => {
    const activeItems = items?.filter(item => item.isActive !== false) || [];
    
    return (
      <div className="equipment-section-adsycon">
        <div className="section-header-adsycon">
          <div className="section-title-adsycon">
            <Icon className="section-icon-adsycon" />
            <h4>{title}</h4>
            <span className="item-count-adsycon">{activeItems.length} items</span>
          </div>
          <button className="btn-add-equipment-adsycon" onClick={() => openAddModal(type)}>
            <FaPlus /> Add {title}
          </button>
        </div>
        <div className="equipment-list-adsycon">
          {activeItems.length === 0 ? (
            <div className="empty-equipment-adsycon">
              <p>No {title.toLowerCase()} added yet. Click "Add {title}" to get started.</p>
            </div>
          ) : (
            activeItems.map((item) => (
              <EquipmentCard 
                key={item._id} 
                item={item} 
                type={type}
                onEdit={openEditModal}
                onRemove={handleRemoveEquipment}
              />
            ))
          )}
        </div>
      </div>
    );
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
            <h1>System Configuration</h1>
            <p>Manage system parameters, equipment catalog, and calculation settings</p>
          </div>
          <div className="header-actions-adsycon">
            <button className="btn-reset-adsycon" onClick={handleReset} disabled={saving}>
              <FaUndo /> Reset to Defaults
            </button>
          </div>
        </div>

        <div className="config-tabs-adsycon">
          <button className={`tab-btn-adsycon ${activeTab === 'prices' ? 'active-adsycon' : ''}`} onClick={() => setActiveTab('prices')}>
            Equipment Catalog
          </button>
          <button className={`tab-btn-adsycon ${activeTab === 'calculations' ? 'active-adsycon' : ''}`} onClick={() => setActiveTab('calculations')}>
            Calculations
          </button>
          <button className={`tab-btn-adsycon ${activeTab === 'financial' ? 'active-adsycon' : ''}`} onClick={() => setActiveTab('financial')}>
            Financial
          </button>
          <button className={`tab-btn-adsycon ${activeTab === 'taxes' ? 'active-adsycon' : ''}`} onClick={() => setActiveTab('taxes')}>
            Taxes & Fees
          </button>
          <button className={`tab-btn-adsycon ${activeTab === 'thresholds' ? 'active-adsycon' : ''}`} onClick={() => setActiveTab('thresholds')}>
            Thresholds
          </button>
        </div>

        <div className="config-content-adsycon">
          {/* Equipment Catalog Tab */}
          {activeTab === 'prices' && config && (
            <div className="config-section-adsycon">
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

              {/* 10 Equipment Categories */}
              <EquipmentSection 
                title="Solar Panels" 
                type="solarPanels" 
                icon={FaSolarPanel}
                items={config.equipmentPrices?.solarPanels}
              />

              <EquipmentSection 
                title="Inverters" 
                type="inverters" 
                icon={FaBolt}
                items={config.equipmentPrices?.inverters}
              />

              <EquipmentSection 
                title="Batteries" 
                type="batteries" 
                icon={FaBatteryFull}
                items={config.equipmentPrices?.batteries}
              />

              <EquipmentSection 
                title="Mounting Structures" 
                type="mountingStructures" 
                icon={FaTools}
                items={config.equipmentPrices?.mountingStructures}
              />

              <EquipmentSection 
                title="Electrical Components" 
                type="electricalComponents" 
                icon={FaPlug}
                items={config.equipmentPrices?.electricalComponents}
              />

              <EquipmentSection 
                title="Cables & Wiring" 
                type="cablesAndWiring" 
                icon={FaWrench}
                items={config.equipmentPrices?.cablesAndWiring}
              />

              <EquipmentSection 
                title="Safety Equipment" 
                type="safetyEquipment" 
                icon={FaHardHat}
                items={config.equipmentPrices?.safetyEquipment}
              />

              <EquipmentSection 
                title="Junction Boxes" 
                type="junctionBoxes" 
                icon={FaBox}
                items={config.equipmentPrices?.junctionBoxes}
              />

              <EquipmentSection 
                title="Disconnect Switches" 
                type="disconnectSwitches" 
                icon={FaPowerOff}
                items={config.equipmentPrices?.disconnectSwitches}
              />

              <EquipmentSection 
                title="Meters" 
                type="meters" 
                icon={FaChartLine}
                items={config.equipmentPrices?.meters}
              />

              <h4>👷 Labor Rates</h4>
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
                <button className="btn-save-adsycon" onClick={() => handleSave({ 
                  assessmentFee: config.assessmentFee, 
                  equipmentPrices: config.equipmentPrices, 
                  laborRates: config.laborRates 
                })}>
                  <FaSave /> Save Changes
                </button>
              </div>
            </div>
          )}

          {/* Calculations Tab */}
          {activeTab === 'calculations' && config && (
            <div className="config-section-adsycon">
              <h3>System Calculation Parameters</h3>
              
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
              <h3>Financial Parameters</h3>
              
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
              <h3>Taxes and Additional Fees</h3>
              
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
              <h3>System Size Thresholds (kW)</h3>
              
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

        {/* Equipment Modal (Add/Edit) */}
        {showEquipmentModal && (
          <div className="modal-overlay-adsycon" onClick={() => setShowEquipmentModal(false)}>
            <div className="modal-content-adsycon equipment-modal-adsycon" onClick={e => e.stopPropagation()}>
              <div className="modal-header-adsycon">
                <h3>{editingItem ? 'Edit' : 'Add'} {equipmentType?.slice(0, -1)}</h3>
                <button className="modal-close-adsycon" onClick={() => setShowEquipmentModal(false)}>
                  <FaTimes />
                </button>
              </div>
              
              <div className="modal-body-adsycon">
                <div className="form-group-adsycon">
                  <label>Name *</label>
                  <input
                    type="text"
                    value={equipmentForm.name}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                    placeholder="e.g., Standard Monocrystalline 450W"
                  />
                </div>

                <div className="form-group-adsycon">
                  <label>Price *</label>
                  <div className="input-group-adsycon">
                    <span className="currency-adsycon">₱</span>
                    <input
                      type="number"
                      value={equipmentForm.price}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, price: parseFloat(e.target.value) })}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="form-row-adsycon">
                  <div className="form-group-adsycon">
                    <label>Unit</label>
                    <select
                      value={equipmentForm.unit}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, unit: e.target.value })}
                    >
                      <option value="piece">Piece</option>
                      <option value="watt">Watt</option>
                      <option value="kw">kW</option>
                      <option value="meter">Meter</option>
                      <option value="set">Set</option>
                      <option value="pair">Pair</option>
                    </select>
                  </div>

                  <div className="form-group-adsycon">
                    <label>Warranty (years)</label>
                    <input
                      type="number"
                      value={equipmentForm.warranty}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, warranty: parseInt(e.target.value) })}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-group-adsycon">
                  <label>Brand</label>
                  <input
                    type="text"
                    value={equipmentForm.brand}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, brand: e.target.value })}
                    placeholder="Brand name (optional)"
                  />
                </div>

                <div className="form-group-adsycon">
                  <label>Notes</label>
                  <textarea
                    rows="2"
                    value={equipmentForm.notes}
                    onChange={(e) => setEquipmentForm({ ...equipmentForm, notes: e.target.value })}
                    placeholder="Additional notes (optional)"
                  />
                </div>
              </div>

              <div className="modal-actions-adsycon">
                <button className="btn-cancel-adsycon" onClick={() => setShowEquipmentModal(false)}>
                  Cancel
                </button>
                <button 
                  className="btn-confirm-adsycon" 
                  onClick={editingItem ? handleUpdateEquipment : handleAddEquipment}
                  disabled={saving}
                >
                  {saving ? <FaSpinner className="spinner-adsycon" /> : <FaCheckCircle />}
                  {editingItem ? ' Update' : ' Add'}
                </button>
              </div>
            </div>
          </div>
        )}

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