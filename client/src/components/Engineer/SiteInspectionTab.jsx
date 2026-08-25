// components/Engineer/SiteInspectionTab.jsx
import React, { useState, useEffect } from 'react';
import { FaSun, FaMoon, FaLightbulb, FaFileInvoice, FaPlug } from 'react-icons/fa';
import { useToast, ToastNotification } from '../../assets/toastnotification';

const SiteInspectionTab = ({
  assessmentForm,
  onAssessmentFormChange,
  siteInspectionData,
  onSiteInspectionDataChange,
  deviceAssigned,
  assessmentStatus,
  deployNotes,
  onDeployNotesChange,
  onSave,
  onDeploy,
  isSubmitting,
  ROOF_CONDITIONS,
  STRUCTURAL_INTEGRITY,
  appliances = [],
  initialCalculationResults = {}
}) => {
  const { toast, showToast, hideToast } = useToast();

  // Local state for the appliance modal
  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [editingAppliance, setEditingAppliance] = useState(null);
  const [applianceForm, setApplianceForm] = useState({
    name: '',
    powerWatts: '',
    quantity: '',
    dayHours: '',
    nightHours: '',
    isMotor: false
  });
  const [applianceErrors, setApplianceErrors] = useState({});

  // Delete confirmation modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [applianceToDelete, setApplianceToDelete] = useState(null);

  // ============ VALIDATION ERRORS STATE ============
  const [validationErrors, setValidationErrors] = useState({
    monthlyBill: '',
    ratePerKwh: '',
    systemType: '',
    roofType: '',
    roofCondition: '',
    roofLength: '',
    roofWidth: '',
    structuralIntegrity: '',
    estimatedInstallationTime: '',
    siteVisitNotes: '',
    recommendations: '',
    technicalFindings: '',
    deployNotes: ''
  });

  // ============ ENERGY PROFILE CALCULATION ============
  const calculateConsumption = (appliancesList) => {
    let totalDayWatts = 0;
    let totalNightWatts = 0;

    appliancesList.forEach(appliance => {
      const applianceDayWatts = (appliance.powerWatts || 0) * (appliance.quantity || 0) * (appliance.dayHours || 0);
      const applianceNightWatts = (appliance.powerWatts || 0) * (appliance.quantity || 0) * (appliance.nightHours || 0);
      totalDayWatts += applianceDayWatts;
      totalNightWatts += applianceNightWatts;
    });

    const dayKwh = totalDayWatts / 1000;
    const nightKwh = totalNightWatts / 1000;
    const totalKwhFromAppliances = dayKwh + nightKwh;

    let dayPercent = 0;
    let nightPercent = 0;

    if (totalKwhFromAppliances > 0) {
      dayPercent = (dayKwh / totalKwhFromAppliances) * 100;
      nightPercent = (nightKwh / totalKwhFromAppliances) * 100;
    }

    const monthlyKwh = totalKwhFromAppliances * 30;

    return {
      totalDailyConsumption: totalKwhFromAppliances,
      dayConsumption: dayKwh,
      nightConsumption: nightKwh,
      dayPercentage: dayPercent,
      nightPercentage: nightPercent,
      monthlyConsumption: monthlyKwh
    };
  };

  const calculateMotorNonMotorWatts = (appliancesList) => {
    let motor = 0;
    let nonMotor = 0;
    appliancesList.forEach(app => {
      const totalWatts = (app.powerWatts || 0) * (app.quantity || 0);
      if (app.isMotor) {
        motor += totalWatts;
      } else {
        nonMotor += totalWatts;
      }
    });
    return { motorWatts: motor, nonMotorWatts: nonMotor };
  };

  // ============ LOCAL CALCULATION RESULTS STATE ============
  const [calculationResults, setCalculationResults] = useState({
    totalDailyConsumption: 0,
    dayConsumption: 0,
    nightConsumption: 0,
    dayPercentage: 0,
    nightPercentage: 0,
    monthlyConsumption: 0
  });

  const activeAppliances = siteInspectionData.appliances?.length > 0 
    ? siteInspectionData.appliances 
    : appliances;

  useEffect(() => {
    if (activeAppliances && activeAppliances.length > 0) {
      const results = calculateConsumption(activeAppliances);
      setCalculationResults(results);
    } else {
      setCalculationResults({
        totalDailyConsumption: 0,
        dayConsumption: 0,
        nightConsumption: 0,
        dayPercentage: 0,
        nightPercentage: 0,
        monthlyConsumption: 0
      });
    }
  }, [activeAppliances]);

  const displayResults = calculationResults;
  const { motorWatts, nonMotorWatts } = calculateMotorNonMotorWatts(activeAppliances);

  // ============ VALIDATION FUNCTIONS ============
  const validateMonthlyBill = (value) => {
    if (!value || value === '') return 'Monthly electricity bill is required';
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return 'Monthly bill must be greater than 0';
    if (num > 1000000) return 'Monthly bill seems too high. Please check your input.';
    return '';
  };

  const validateRatePerKwh = (value) => {
    if (!value || value === '') return 'Rate per kWh is required';
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return 'Rate must be greater than 0';
    if (num > 100) return 'Rate seems too high. Please check your input.';
    return '';
  };

  const validateSystemType = (value) => {
    if (!value) return 'Please select a preferred system type';
    return '';
  };

  const validateRoofType = (value) => {
    if (!value) return 'Please select a roof type';
    return '';
  };

  const validateRoofCondition = (value) => {
    if (!value) return 'Please select a roof condition';
    return '';
  };

  const validateRoofDimension = (value, fieldName) => {
    if (!value || value === '') return `${fieldName} is required`;
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return `${fieldName} must be greater than 0`;
    if (num > 100) return `${fieldName} cannot exceed 100 meters`;
    return '';
  };

  const validateStructuralIntegrity = (value) => {
    if (!value) return 'Please select structural integrity';
    return '';
  };

  const validateEstimatedInstallationTime = (value) => {
    if (!value || value === '') return 'Estimated installation time is required';
    const num = parseFloat(value);
    if (isNaN(num) || num <= 0) return 'Installation time must be greater than 0';
    if (num > 365) return 'Installation time cannot exceed 365 days';
    return '';
  };

  const validateSiteVisitNotes = (value) => {
    if (!value || value.trim() === '') return 'Site visit notes are required';
    if (value.trim().length < 10) return 'Please provide more detailed notes (minimum 10 characters)';
    return '';
  };

  const validateRecommendations = (value) => {
    if (!value || value.trim() === '') return 'Engineer recommendations are required';
    if (value.trim().length < 10) return 'Please provide more detailed recommendations (minimum 10 characters)';
    return '';
  };

  const validateTechnicalFindings = (value) => {
    if (!value || value.trim() === '') return 'Technical findings are required';
    if (value.trim().length < 10) return 'Please provide more detailed findings (minimum 10 characters)';
    return '';
  };

  const validateDeployNotes = (value) => {
    if (deviceAssigned && (!value || value.trim() === '')) {
      return 'Deployment notes are required before deploying the device';
    }
    return '';
  };

  // ============ VALIDATE ALL FIELDS ============
  const validateAllFields = () => {
    const errors = {
      monthlyBill: validateMonthlyBill(siteInspectionData.monthlyBill),
      ratePerKwh: validateRatePerKwh(siteInspectionData.ratePerKwh),
      systemType: validateSystemType(siteInspectionData.systemType),
      roofType: validateRoofType(siteInspectionData.roofType),
      roofCondition: validateRoofCondition(assessmentForm.roofCondition),
      roofLength: validateRoofDimension(assessmentForm.roofLength, 'Roof length'),
      roofWidth: validateRoofDimension(assessmentForm.roofWidth, 'Roof width'),
      structuralIntegrity: validateStructuralIntegrity(assessmentForm.structuralIntegrity),
      estimatedInstallationTime: validateEstimatedInstallationTime(assessmentForm.estimatedInstallationTime),
      siteVisitNotes: validateSiteVisitNotes(assessmentForm.siteVisitNotes),
      recommendations: validateRecommendations(assessmentForm.recommendations),
      technicalFindings: validateTechnicalFindings(assessmentForm.technicalFindings),
      deployNotes: validateDeployNotes(deployNotes)
    };

    setValidationErrors(errors);

    const hasErrors = Object.values(errors).some(error => error !== '');
    return !hasErrors;
  };

  // ============ FIELD CHANGE HANDLERS WITH VALIDATION ============
  const handleSiteInspectionChange = (field, value) => {
    onSiteInspectionDataChange(field, value);
    
    let error = '';
    switch(field) {
      case 'monthlyBill':
        error = validateMonthlyBill(value);
        break;
      case 'ratePerKwh':
        error = validateRatePerKwh(value);
        break;
      case 'systemType':
        error = validateSystemType(value);
        break;
      case 'roofType':
        error = validateRoofType(value);
        break;
      default:
        break;
    }
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleAssessmentFormChangeWithValidation = (field, value) => {
    onAssessmentFormChange(field, value);
    
    let error = '';
    switch(field) {
      case 'roofCondition':
        error = validateRoofCondition(value);
        break;
      case 'roofLength':
        error = validateRoofDimension(value, 'Roof length');
        break;
      case 'roofWidth':
        error = validateRoofDimension(value, 'Roof width');
        break;
      case 'structuralIntegrity':
        error = validateStructuralIntegrity(value);
        break;
      case 'estimatedInstallationTime':
        error = validateEstimatedInstallationTime(value);
        break;
      case 'siteVisitNotes':
        error = validateSiteVisitNotes(value);
        break;
      case 'recommendations':
        error = validateRecommendations(value);
        break;
      case 'technicalFindings':
        error = validateTechnicalFindings(value);
        break;
      default:
        break;
    }
    setValidationErrors(prev => ({ ...prev, [field]: error }));
  };

  const handleDeployNotesChange = (value) => {
    onDeployNotesChange(value);
    const error = validateDeployNotes(value);
    setValidationErrors(prev => ({ ...prev, deployNotes: error }));
  };

  const handleSave = () => {
    if (validateAllFields()) {
      onSave();
    }
  };

  // ============ APPLIANCE MANAGEMENT FUNCTIONS ============
  const addSiteAppliance = () => {
    setEditingAppliance(null);
    setApplianceForm({ name: '', powerWatts: '', quantity: '', dayHours: '', nightHours: '', isMotor: false });
    setApplianceErrors({});
    setShowApplianceModal(true);
  };

  const editSiteAppliance = (appliance, index) => {
    setEditingAppliance({ ...appliance, index });
    setApplianceForm({
      name: appliance.name,
      powerWatts: appliance.powerWatts,
      quantity: appliance.quantity,
      dayHours: appliance.dayHours || 0,
      nightHours: appliance.nightHours || 0,
      isMotor: appliance.isMotor || false
    });
    setApplianceErrors({});
    setShowApplianceModal(true);
  };

  const deleteSiteAppliance = (index) => {
    setApplianceToDelete(index);
    setShowDeleteModal(true);
  };

  const confirmDeleteAppliance = () => {
    if (applianceToDelete !== null) {
      const updated = [...siteInspectionData.appliances];
      const deletedAppliance = updated[applianceToDelete];
      updated.splice(applianceToDelete, 1);
      onSiteInspectionDataChange('appliances', updated);
      setShowDeleteModal(false);
      setApplianceToDelete(null);
      showToast(`"${deletedAppliance?.name || 'Appliance'}" removed successfully`, 'success');
    }
  };

  const cancelDeleteAppliance = () => {
    setShowDeleteModal(false);
    setApplianceToDelete(null);
  };

  const saveSiteAppliance = () => {
    const errors = {};
    if (!applianceForm.name) errors.name = 'Appliance name is required';
    else if (!/^[a-zA-Z\s]+$/.test(applianceForm.name)) errors.name = 'Appliance name can only contain letters and spaces';
    if (!applianceForm.powerWatts) errors.powerWatts = 'Power rating is required';
    else if (parseFloat(applianceForm.powerWatts) <= 0) errors.powerWatts = 'Power must be greater than 0';
    if (!applianceForm.quantity) errors.quantity = 'Quantity is required';
    else if (parseInt(applianceForm.quantity) <= 0) errors.quantity = 'Quantity must be at least 1';
    if (applianceForm.dayHours && (parseFloat(applianceForm.dayHours) < 0 || parseFloat(applianceForm.dayHours) > 12)) {
      errors.dayHours = 'Day hours must be between 0 and 12';
    }
    if (applianceForm.nightHours && (parseFloat(applianceForm.nightHours) < 0 || parseFloat(applianceForm.nightHours) > 12)) {
      errors.nightHours = 'Night hours must be between 0 and 12';
    }

    if (Object.keys(errors).length > 0) {
      setApplianceErrors(errors);
      return;
    }

    const newAppliance = {
      name: applianceForm.name,
      powerWatts: parseFloat(applianceForm.powerWatts),
      quantity: parseInt(applianceForm.quantity),
      dayHours: Math.min(Math.max(parseFloat(applianceForm.dayHours) || 0, 0), 12),
      nightHours: Math.min(Math.max(parseFloat(applianceForm.nightHours) || 0, 0), 12),
      isMotor: applianceForm.isMotor || false
    };

    if (editingAppliance) {
      const updated = [...siteInspectionData.appliances];
      updated[editingAppliance.index] = newAppliance;
      onSiteInspectionDataChange('appliances', updated);
      showToast(`"${newAppliance.name}" updated successfully`, 'success');
    } else {
      onSiteInspectionDataChange('appliances', [...siteInspectionData.appliances, newAppliance]);
      showToast(`"${newAppliance.name}" added successfully`, 'success');
    }

    setShowApplianceModal(false);
    setEditingAppliance(null);
    setApplianceForm({ name: '', powerWatts: '', quantity: '', dayHours: '', nightHours: '', isMotor: false });
    setApplianceErrors({});
  };

  const handleApplianceFormChange = (field, value) => {
    setApplianceForm(prev => ({ ...prev, [field]: value }));
    if (applianceErrors[field]) {
      setApplianceErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <div>
      {/* Action Buttons */}
      <div className="action-buttons-enad">
        <button onClick={handleSave} disabled={isSubmitting} className="btn-secondary-enad">
          {isSubmitting ? 'Saving...' : 'Save All Changes'}
        </button>
        {assessmentStatus !== 'device_deployed' &&
          assessmentStatus !== 'data_collecting' &&
          deviceAssigned && (
            <button 
              onClick={onDeploy} 
              disabled={isSubmitting || !deployNotes || deployNotes.trim() === ''} 
              className="btn-success-enad"
            >
              {isSubmitting ? 'Deploying...' : 'Deploy Device (Start 7-day Monitoring)'}
            </button>
          )}
      </div>

      {/* ===== APPLIANCES SECTION ===== */}
      <div className="form-section-enad">
        <div className="form-section-header-enad">
          <h4>Appliances</h4>
          <button
            type="button"
            className="add-appliance-btn-enad"
            onClick={addSiteAppliance}
          >
            + Add Appliance
          </button>
        </div>

        {siteInspectionData.appliances?.length === 0 ? (
          <div className="empty-appliances-enad">
            <p>No appliances added yet. Click "Add Appliance" to list electrical devices.</p>
          </div>
        ) : (
          <div className="appliances-table-container-enad">
            <table className="appliances-table-enad">
              <thead>
                <tr>
                  <th>Appliance</th>
                  <th>Power (W)</th>
                  <th>Qty</th>
                  <th>Day Hrs</th>
                  <th>Night Hrs</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {siteInspectionData.appliances?.map((appliance, index) => (
                  <tr key={index}>
                    <td><strong>{appliance.name}</strong></td>
                    <td>{appliance.powerWatts} W</td>
                    <td>{appliance.quantity}</td>
                    <td>{appliance.dayHours || 0} hrs</td>
                    <td>{appliance.nightHours || 0} hrs</td>
                    <td>
                      <span className="appliance-type-badge-enad">
                        {appliance.isMotor ? 'Motor' : 'Non-Motor'}
                      </span>
                    </td>
                    <td>
                      <button className="edit-appliance-btn-enad" onClick={() => editSiteAppliance(appliance, index)}>
                        Edit
                      </button>
                      <button className="delete-appliance-btn-enad" onClick={() => deleteSiteAppliance(index)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ===== ENERGY PROFILE SECTION ===== */}
      {activeAppliances.length > 0 && (
        <div className="consumption-results-cusset-enad">
          <h4>Energy Profile</h4>
          <div className="results-grid-cusset-enad">
            <div className="result-card-cusset-enad day-result">
              <FaSun className="result-icon-enad" />
              <div className="result-info-enad">
                <span className="result-label-enad">Day Consumption</span>
                <span className="result-value-enad">{displayResults.dayConsumption?.toFixed(2) || 0} kWh</span>
                <span className="result-percentage-enad">({displayResults.dayPercentage?.toFixed(1) || 0}%)</span>
              </div>
            </div>
            <div className="result-card-cusset-enad night-result">
              <FaMoon className="result-icon-enad" />
              <div className="result-info-enad">
                <span className="result-label-enad">Night Consumption</span>
                <span className="result-value-enad">{displayResults.nightConsumption?.toFixed(2) || 0} kWh</span>
                <span className="result-percentage-enad">({displayResults.nightPercentage?.toFixed(1) || 0}%)</span>
              </div>
            </div>
            <div className="result-card-cusset-enad total-result">
              <FaLightbulb className="result-icon-enad" />
              <div className="result-info-enad">
                <span className="result-label-enad">Total Daily</span>
                <span className="result-value-enad">{displayResults.totalDailyConsumption?.toFixed(2) || 0} kWh/day</span>
                <small>Motor {motorWatts.toFixed(0)} W | Non-Motor {nonMotorWatts.toFixed(0)} W</small>
              </div>
            </div>
            <div className="result-card-cusset-enad monthly-result">
              <FaFileInvoice className="result-icon-enad" />
              <div className="result-info-enad">
                <span className="result-label-enad">Monthly Consumption</span>
                <span className="result-value-enad">{displayResults.monthlyConsumption?.toFixed(2) || 0} kWh</span>
                <small>Total Daily × 30 days</small>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== MONTHLY BILL & RATE ===== */}
      <div className="form-row-grid-enad">
        <div className="form-group-enad">
          <label className="form-label-enad">Monthly Electricity Bill (₱) *</label>
          <input
            type="number"
            step="0.01"
            className={`assessment-form-input-enad ${validationErrors.monthlyBill ? 'error' : ''}`}
            value={siteInspectionData.monthlyBill || ''}
            onChange={(e) => handleSiteInspectionChange('monthlyBill', e.target.value)}
            placeholder="e.g., 5000"
          />
          {validationErrors.monthlyBill && (
            <div className="error-message-enad">{validationErrors.monthlyBill}</div>
          )}
          <small className="form-hint-enad">Client's average monthly electricity bill</small>
        </div>

        <div className="form-group-enad">
          <label className="form-label-enad">Rate per kWh (₱) *</label>
          <input
            type="number"
            step="0.01"
            className={`assessment-form-input-enad ${validationErrors.ratePerKwh ? 'error' : ''}`}
            value={siteInspectionData.ratePerKwh || ''}
            onChange={(e) => handleSiteInspectionChange('ratePerKwh', e.target.value)}
            placeholder="e.g., 11.50"
          />
          {validationErrors.ratePerKwh && (
            <div className="error-message-enad">{validationErrors.ratePerKwh}</div>
          )}
          <small className="form-hint-enad">Electric rate from client's bill</small>
        </div>
      </div>

      {/* ===== SYSTEM TYPE & ROOF TYPE ===== */}
      <div className="form-row-grid-enad">
        <div className="form-group-enad">
          <label className="form-label-enad">Preferred System Type *</label>
          <select
            className={`assessment-form-select-enad ${validationErrors.systemType ? 'error' : ''}`}
            value={siteInspectionData.systemType || 'grid-tie'}
            onChange={(e) => handleSiteInspectionChange('systemType', e.target.value)}
          >
            <option value="">Select system type</option>
            <option value="grid-tie">Grid-Tie System</option>
            <option value="hybrid">Hybrid System (with battery)</option>
            <option value="off-grid">Off-Grid System</option>
          </select>
          {validationErrors.systemType && (
            <div className="error-message-enad">{validationErrors.systemType}</div>
          )}
          <small className="form-hint-enad">Client's preferred system configuration</small>
        </div>

        <div className="form-group-enad">
          <label className="form-label-enad">Roof Type *</label>
          <select
            className={`assessment-form-select-enad ${validationErrors.roofType ? 'error' : ''}`}
            value={siteInspectionData.roofType || ''}
            onChange={(e) => handleSiteInspectionChange('roofType', e.target.value)}
          >
            <option value="">Select roof type</option>
            <option value="concrete">Concrete</option>
            <option value="metal">Metal</option>
            <option value="tile">Tile</option>
            <option value="other">Other</option>
          </select>
          {validationErrors.roofType && (
            <div className="error-message-enad">{validationErrors.roofType}</div>
          )}
          <small className="form-hint-enad">Type of roof structure</small>
        </div>
      </div>

      {/* ===== EXISTING FIELDS ===== */}
      <div className="form-group-enad">
        <label className="form-label-enad">Roof Condition *</label>
        <div className="options-group-enad">
          {ROOF_CONDITIONS.map(condition => (
            <button
              key={condition.value}
              type="button"
              onClick={() => handleAssessmentFormChangeWithValidation('roofCondition', condition.value)}
              className={`option-btn-enad ${assessmentForm.roofCondition === condition.value ? 'active-enad' : ''}`}
            >
              {condition.label}
            </button>
          ))}
        </div>
        {validationErrors.roofCondition && (
          <div className="error-message-enad">{validationErrors.roofCondition}</div>
        )}
      </div>

      <div className="form-group-enad">
        <label className="form-label-enad">Roof Dimensions (meters) *</label>
        <div className="form-row-enad">
          <div className="dimension-input-enad">
            <input
              type="number"
              step="0.1"
              className={`assessment-form-input-enad ${validationErrors.roofLength ? 'error' : ''}`}
              value={assessmentForm.roofLength || ''}
              onChange={(e) => handleAssessmentFormChangeWithValidation('roofLength', parseFloat(e.target.value))}
              placeholder="Length (m)"
              required
            />
          </div>
          <div className="dimension-input-enad">
            <input
              type="number"
              step="0.1"
              className={`assessment-form-input-enad ${validationErrors.roofWidth ? 'error' : ''}`}
              value={assessmentForm.roofWidth || ''}
              onChange={(e) => handleAssessmentFormChangeWithValidation('roofWidth', parseFloat(e.target.value))}
              placeholder="Width (m)"
              required
            />
          </div>
        </div>
        {validationErrors.roofLength && (
          <div className="error-message-enad">{validationErrors.roofLength}</div>
        )}
        {validationErrors.roofWidth && (
          <div className="error-message-enad">{validationErrors.roofWidth}</div>
        )}
        <small className="form-hint-enad">Measured during site inspection (Required)</small>
      </div>

      <div className="form-group-enad">
        <label className="form-label-enad">Structural Integrity *</label>
        <div className="options-group-enad">
          {STRUCTURAL_INTEGRITY.map(integrity => (
            <button
              key={integrity.value}
              type="button"
              onClick={() => handleAssessmentFormChangeWithValidation('structuralIntegrity', integrity.value)}
              className={`option-btn-enad ${assessmentForm.structuralIntegrity === integrity.value ? 'active-enad' : ''}`}
            >
              {integrity.label}
            </button>
          ))}
        </div>
        {validationErrors.structuralIntegrity && (
          <div className="error-message-enad">{validationErrors.structuralIntegrity}</div>
        )}
      </div>

      <div className="form-group-enad">
        <label className="form-label-enad">Estimated Installation Time (days) *</label>
        <input
          type="number"
          className={`assessment-form-input-enad ${validationErrors.estimatedInstallationTime ? 'error' : ''}`}
          value={assessmentForm.estimatedInstallationTime}
          onChange={(e) => handleAssessmentFormChangeWithValidation('estimatedInstallationTime', e.target.value)}
          required
        />
        {validationErrors.estimatedInstallationTime && (
          <div className="error-message-enad">{validationErrors.estimatedInstallationTime}</div>
        )}
      </div>

      {deviceAssigned && (
        <div className="form-group-enad">
          <label className="form-label-enad">Deployment Notes *</label>
          <textarea
            className={`assessment-form-textarea-enad ${validationErrors.deployNotes ? 'error' : ''}`}
            value={deployNotes}
            onChange={(e) => handleDeployNotesChange(e.target.value)}
            rows={3}
            placeholder="Enter deployment notes, device placement location, etc... (Required)"
            required
          />
          {validationErrors.deployNotes && (
            <div className="error-message-enad">{validationErrors.deployNotes}</div>
          )}
        </div>
      )}

      <div className="form-group-enad">
        <label className="form-label-enad">Site Visit Notes *</label>
        <textarea
          className={`assessment-form-textarea-enad ${validationErrors.siteVisitNotes ? 'error' : ''}`}
          value={assessmentForm.siteVisitNotes}
          onChange={(e) => handleAssessmentFormChangeWithValidation('siteVisitNotes', e.target.value)}
          rows={4}
          placeholder="Additional notes, observations, recommendations..."
          required
        />
        {validationErrors.siteVisitNotes && (
          <div className="error-message-enad">{validationErrors.siteVisitNotes}</div>
        )}
      </div>

      <div className="form-group-enad">
        <label className="form-label-enad">Engineer Recommendations *</label>
        <textarea
          className={`assessment-form-textarea-enad ${validationErrors.recommendations ? 'error' : ''}`}
          value={assessmentForm.recommendations}
          onChange={(e) => handleAssessmentFormChangeWithValidation('recommendations', e.target.value)}
          rows={3}
          placeholder="Summary of recommendations for the client..."
          required
        />
        {validationErrors.recommendations && (
          <div className="error-message-enad">{validationErrors.recommendations}</div>
        )}
      </div>

      <div className="form-group-enad">
        <label className="form-label-enad">Technical Findings *</label>
        <textarea
          className={`assessment-form-textarea-enad ${validationErrors.technicalFindings ? 'error' : ''}`}
          value={assessmentForm.technicalFindings}
          onChange={(e) => handleAssessmentFormChangeWithValidation('technicalFindings', e.target.value)}
          rows={3}
          placeholder="Technical observations, electrical assessment, structural findings..."
          required
        />
        {validationErrors.technicalFindings && (
          <div className="error-message-enad">{validationErrors.technicalFindings}</div>
        )}
      </div>

      {/* ===== APPLIANCE MODAL ===== */}
      {showApplianceModal && (
        <div className="modal-overlay-enad" onClick={() => setShowApplianceModal(false)}>
          <div className="modal-content-enad appliance-modal-enad" onClick={e => e.stopPropagation()}>
            <div className="modal-header-enad">
              <h3>{editingAppliance ? 'Edit Appliance' : 'Add Appliance'}</h3>
              <button className="modal-close-enad" onClick={() => setShowApplianceModal(false)}>×</button>
            </div>
            <div className="modal-body-enad">
              <div className="form-group-enad">
                <label className="form-label-enad">Appliance Name *</label>
                <input
                  type="text"
                  className={`assessment-form-input-enad ${applianceErrors.name ? 'error' : ''}`}
                  value={applianceForm.name}
                  onChange={(e) => handleApplianceFormChange('name', e.target.value)}
                  placeholder="e.g., Air Conditioner, Refrigerator"
                />
                {applianceErrors.name && <div className="error-message-enad">{applianceErrors.name}</div>}
              </div>

              <div className="form-row-grid-enad">
                <div className="form-group-enad">
                  <label className="form-label-enad">Power Rating (Watts) *</label>
                  <input
                    type="number"
                    step="0.1"
                    className={`assessment-form-input-enad ${applianceErrors.powerWatts ? 'error' : ''}`}
                    value={applianceForm.powerWatts}
                    onChange={(e) => handleApplianceFormChange('powerWatts', e.target.value)}
                    placeholder="e.g., 1500"
                  />
                  {applianceErrors.powerWatts && <div className="error-message-enad">{applianceErrors.powerWatts}</div>}
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">Quantity *</label>
                  <input
                    type="number"
                    className={`assessment-form-input-enad ${applianceErrors.quantity ? 'error' : ''}`}
                    value={applianceForm.quantity}
                    onChange={(e) => handleApplianceFormChange('quantity', e.target.value)}
                    placeholder="e.g., 2"
                  />
                  {applianceErrors.quantity && <div className="error-message-enad">{applianceErrors.quantity}</div>}
                </div>
              </div>

              <div className="form-row-grid-enad">
                <div className="form-group-enad">
                  <label className="form-label-enad">Day Usage Hours (0-12)</label>
                  <input
                    type="number"
                    step="0.5"
                    className={`assessment-form-input-enad ${applianceErrors.dayHours ? 'error' : ''}`}
                    value={applianceForm.dayHours}
                    onChange={(e) => handleApplianceFormChange('dayHours', e.target.value)}
                    placeholder="e.g., 8"
                    min="0"
                    max="12"
                  />
                  {applianceErrors.dayHours && <div className="error-message-enad">{applianceErrors.dayHours}</div>}
                  <small className="form-hint-enad">Hours used 6 AM - 6 PM</small>
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">Night Usage Hours (0-12)</label>
                  <input
                    type="number"
                    step="0.5"
                    className={`assessment-form-input-enad ${applianceErrors.nightHours ? 'error' : ''}`}
                    value={applianceForm.nightHours}
                    onChange={(e) => handleApplianceFormChange('nightHours', e.target.value)}
                    placeholder="e.g., 4"
                    min="0"
                    max="12"
                  />
                  {applianceErrors.nightHours && <div className="error-message-enad">{applianceErrors.nightHours}</div>}
                  <small className="form-hint-enad">Hours used 6 PM - 6 AM</small>
                </div>
              </div>

              <div className="form-group-enad">
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={applianceForm.isMotor || false}
                    onChange={(e) => handleApplianceFormChange('isMotor', e.target.checked)}
                  />
                  <span>This is a motor appliance</span>
                </label>
                <small className="form-hint-enad">e.g., air conditioner, refrigerator, water pump</small>
              </div>
            </div>
            <div className="modal-actions-enad">
              <button className="cancel-btn-enad" onClick={() => setShowApplianceModal(false)}>Cancel</button>
              <button className="confirm-btn-enad" onClick={saveSiteAppliance}>
                {editingAppliance ? 'Update' : 'Add'} Appliance
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteModal && (
        <div className="modal-overlay-enad" onClick={cancelDeleteAppliance}>
          <div className="modal-content-enad confirm-modal-enad" onClick={e => e.stopPropagation()}>
            <div className="modal-header-enad">
              <h3>Confirm Delete</h3>
              <button className="modal-close-enad" onClick={cancelDeleteAppliance}>×</button>
            </div>
            <div className="modal-body-enad">
              <div className="confirm-message-enad">
                <p>
                  Are you sure you want to delete <strong>
                    {applianceToDelete !== null && siteInspectionData.appliances[applianceToDelete]?.name}
                  </strong>?
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '4px' }}>
                  This action cannot be undone.
                </p>
              </div>
            </div>
            <div className="modal-actions-enad">
              <button className="cancel-btn-enad" onClick={cancelDeleteAppliance}>Cancel</button>
              <button className="confirm-delete-btn-enad" onClick={confirmDeleteAppliance}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} />
    </div>
  );
};

export default SiteInspectionTab;