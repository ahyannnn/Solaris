// components/Engineer/SystemEquipmentSelection.jsx
import React, { useState, useEffect } from 'react';
import { useToast, ToastNotification } from '../../assets/toastnotification';

export const SystemEquipmentSelection = ({
  // Panels
  availablePanels,
  freeQuoteSelectedPanel, setFreeQuoteSelectedPanel,
  freeQuotePanelQuantity, setFreeQuotePanelQuantity,
  freeQuoteCalculatedCosts,
  // Inverters
  availableInverters,
  freeQuoteSelectedInverter, setFreeQuoteSelectedInverter,
  freeQuoteInverterQuantity, setFreeQuoteInverterQuantity,
  // Batteries
  availableBatteries,
  freeQuoteSelectedBattery, setFreeQuoteSelectedBattery,
  freeQuoteBatteryQuantity, setFreeQuoteBatteryQuantity,
  // Mounting
  availableMountingStructures,
  freeQuoteSelectedMountingStructure, setFreeQuoteSelectedMountingStructure,
  freeQuoteMountingStructureQuantity, setFreeQuoteMountingStructureQuantity,
  // Electrical Components
  availableElectricalComponents,
  freeQuoteSelectedElectricalComponents,
  freeQuoteAddElectricalComponent,
  freeQuoteUpdateElectricalComponent,
  freeQuoteRemoveElectricalComponent,
  // Cables
  availableCables,
  freeQuoteSelectedCables,
  freeQuoteAddCable,
  freeQuoteUpdateCable,
  freeQuoteRemoveCable,
  // Junction Boxes
  availableJunctionBoxes,
  freeQuoteSelectedJunctionBoxes,
  freeQuoteAddJunctionBox,
  freeQuoteUpdateJunctionBox,
  freeQuoteRemoveJunctionBox,
  // Disconnect Switches
  availableDisconnectSwitches,
  freeQuoteSelectedDisconnectSwitches,
  freeQuoteAddDisconnectSwitch,
  freeQuoteUpdateDisconnectSwitch,
  freeQuoteRemoveDisconnectSwitch,
  // Meters
  availableMeters,
  freeQuoteSelectedMeters,
  freeQuoteAddMeter,
  freeQuoteUpdateMeter,
  freeQuoteRemoveMeter,
  // Additional Equipment
  freeQuoteAdditionalEquipment,
  freeQuoteAddAdditionalEquipment,
  freeQuoteUpdateAdditionalEquipment,
  freeQuoteRemoveAdditionalEquipment,
  // Labor & Costs
  laborCostPercentage, setLaborCostPercentage,
  overheadContingencyPercentage, setOverheadContingencyPercentage,
  contractorProfitPercentage, setContractorProfitPercentage,
  discountPercentage, setDiscountPercentage, // NEW: Discount percentage props
  freeQuoteCalculateTotalCosts,
  // Form
  freeQuoteForm,
  handleFreeQuoteFormChange,
  // System Type
  systemType,
  getSystemTypeLabel,

  annualProduction,
  roiData,
  onROICalculated,
  // Utility
  formatCurrency,
  generateQuotationPDF,
  generatingPDF,
  onDiscountValuesChange,
}) => {
  // Validation state for error messages
  const [fieldErrors, setFieldErrors] = useState({});

  // Use the toast hook
  const { toast, showToast, hideToast } = useToast();

  // Validate all equipment selections and quantities
  const validateEquipment = () => {
    const fieldErrorMap = {};

    // Check Panels
    if (!freeQuoteSelectedPanel) {
      fieldErrorMap.panels = 'Please select a panel';
    } else if (freeQuoteSelectedPanel.unit !== 'watt') {
      const minQty = 1;
      const maxQty = 999;
      if (freeQuotePanelQuantity < minQty) {
        fieldErrorMap.panels = `Quantity must be at least ${minQty}`;
      } else if (freeQuotePanelQuantity > maxQty) {
        fieldErrorMap.panels = `Quantity cannot exceed ${maxQty}`;
      }
    }

    // Check Inverters
    if (!freeQuoteSelectedInverter) {
      fieldErrorMap.inverters = 'Please select an inverter';
    } else {
      const minQty = 1;
      const maxQty = 50;
      if (freeQuoteInverterQuantity < minQty) {
        fieldErrorMap.inverters = `Quantity must be at least ${minQty}`;
      } else if (freeQuoteInverterQuantity > maxQty) {
        fieldErrorMap.inverters = `Quantity cannot exceed ${maxQty}`;
      }
    }

    // Check Batteries (if required)
    if (systemType === 'hybrid' || systemType === 'off-grid') {
      if (!freeQuoteSelectedBattery) {
        fieldErrorMap.batteries = `Please select a battery (Required for ${getSystemTypeLabel(systemType)})`;
      } else {
        const minQty = 1;
        const maxQty = 100;
        if (freeQuoteBatteryQuantity < minQty) {
          fieldErrorMap.batteries = `Quantity must be at least ${minQty}`;
        } else if (freeQuoteBatteryQuantity > maxQty) {
          fieldErrorMap.batteries = `Quantity cannot exceed ${maxQty}`;
        }
      }
    }

    // Check Mounting Structure
    if (!freeQuoteSelectedMountingStructure) {
      fieldErrorMap.mounting = 'Please select a mounting structure';
    } else {
      const minQty = 1;
      const maxQty = 999;
      if (freeQuoteMountingStructureQuantity < minQty) {
        fieldErrorMap.mounting = `Quantity must be at least ${minQty}`;
      } else if (freeQuoteMountingStructureQuantity > maxQty) {
        fieldErrorMap.mounting = `Quantity cannot exceed ${maxQty}`;
      }
    }

    // Check Electrical Components
    if (freeQuoteSelectedElectricalComponents.length === 0) {
      fieldErrorMap.electrical = 'Please add at least one component';
    } else {
      let hasError = false;
      freeQuoteSelectedElectricalComponents.forEach((item) => {
        if (!item.id) {
          fieldErrorMap.electrical = 'Please select a component for all items';
          hasError = true;
        }
        const minQty = 1;
        const maxQty = 999;
        if (item.quantity < minQty) {
          fieldErrorMap.electrical = `Quantity must be at least ${minQty} for all items`;
          hasError = true;
        } else if (item.quantity > maxQty) {
          fieldErrorMap.electrical = `Quantity cannot exceed ${maxQty} for all items`;
          hasError = true;
        }
      });
      if (!hasError && freeQuoteSelectedElectricalComponents.length > 0) {
        fieldErrorMap.electrical = '';
      }
    }

    // Check Cables
    if (freeQuoteSelectedCables.length === 0) {
      fieldErrorMap.cables = 'Please add at least one cable';
    } else {
      let hasError = false;
      freeQuoteSelectedCables.forEach((item) => {
        if (!item.id) {
          fieldErrorMap.cables = 'Please select a cable type for all items';
          hasError = true;
        }
        const minLength = 0.5;
        const maxLength = 10000;
        if (item.length < minLength) {
          fieldErrorMap.cables = `Length must be at least ${minLength}m for all items`;
          hasError = true;
        } else if (item.length > maxLength) {
          fieldErrorMap.cables = `Length cannot exceed ${maxLength}m for all items`;
          hasError = true;
        }
        const minQty = 1;
        const maxQty = 999;
        if (item.quantity < minQty) {
          fieldErrorMap.cables = `Quantity must be at least ${minQty} for all items`;
          hasError = true;
        } else if (item.quantity > maxQty) {
          fieldErrorMap.cables = `Quantity cannot exceed ${maxQty} for all items`;
          hasError = true;
        }
      });
      if (!hasError && freeQuoteSelectedCables.length > 0) {
        fieldErrorMap.cables = '';
      }
    }

    // Check Junction Boxes
    if (freeQuoteSelectedJunctionBoxes.length === 0) {
      fieldErrorMap.junctionBoxes = 'Please add at least one junction box';
    } else {
      let hasError = false;
      freeQuoteSelectedJunctionBoxes.forEach((item) => {
        if (!item.id) {
          fieldErrorMap.junctionBoxes = 'Please select a junction box for all items';
          hasError = true;
        }
        const minQty = 1;
        const maxQty = 999;
        if (item.quantity < minQty) {
          fieldErrorMap.junctionBoxes = `Quantity must be at least ${minQty} for all items`;
          hasError = true;
        } else if (item.quantity > maxQty) {
          fieldErrorMap.junctionBoxes = `Quantity cannot exceed ${maxQty} for all items`;
          hasError = true;
        }
      });
      if (!hasError && freeQuoteSelectedJunctionBoxes.length > 0) {
        fieldErrorMap.junctionBoxes = '';
      }
    }

    // Check Disconnect Switches
    if (freeQuoteSelectedDisconnectSwitches.length === 0) {
      fieldErrorMap.disconnectSwitches = 'Please add at least one switch';
    } else {
      let hasError = false;
      freeQuoteSelectedDisconnectSwitches.forEach((item) => {
        if (!item.id) {
          fieldErrorMap.disconnectSwitches = 'Please select a switch for all items';
          hasError = true;
        }
        const minQty = 1;
        const maxQty = 999;
        if (item.quantity < minQty) {
          fieldErrorMap.disconnectSwitches = `Quantity must be at least ${minQty} for all items`;
          hasError = true;
        } else if (item.quantity > maxQty) {
          fieldErrorMap.disconnectSwitches = `Quantity cannot exceed ${maxQty} for all items`;
          hasError = true;
        }
      });
      if (!hasError && freeQuoteSelectedDisconnectSwitches.length > 0) {
        fieldErrorMap.disconnectSwitches = '';
      }
    }

    // Check Meters
    if (freeQuoteSelectedMeters.length === 0) {
      fieldErrorMap.meters = 'Please add at least one meter';
    } else {
      let hasError = false;
      freeQuoteSelectedMeters.forEach((item) => {
        if (!item.id) {
          fieldErrorMap.meters = 'Please select a meter for all items';
          hasError = true;
        }
        const minQty = 1;
        const maxQty = 999;
        if (item.quantity < minQty) {
          fieldErrorMap.meters = `Quantity must be at least ${minQty} for all items`;
          hasError = true;
        } else if (item.quantity > maxQty) {
          fieldErrorMap.meters = `Quantity cannot exceed ${maxQty} for all items`;
          hasError = true;
        }
      });
      if (!hasError && freeQuoteSelectedMeters.length > 0) {
        fieldErrorMap.meters = '';
      }
    }

    // Check Additional Equipment (optional, but validate if present)
    freeQuoteAdditionalEquipment.forEach((item) => {
      if (item.name && !item.name.trim()) {
        fieldErrorMap.additional = 'Please enter item names for all custom items';
      }
      if (item.name && item.quantity < 1) {
        fieldErrorMap.additional = 'Quantity must be at least 1 for all custom items';
      }
      if (item.name && item.price < 0.01) {
        fieldErrorMap.additional = 'Price must be greater than 0 for all custom items';
      }
    });

    // Check if total system cost is 0
    if (freeQuoteCalculatedCosts.totalSystemCost === 0) {
      fieldErrorMap.totalCost = 'Total system cost is 0. Please ensure all equipment is properly configured.';
    }

    setFieldErrors(fieldErrorMap);

    // Return true if there are any errors
    return Object.values(fieldErrorMap).some(error => error && error.length > 0);
  };
  
  // Handle PDF generation with validation
  const handleGeneratePDF = () => {
    const hasErrors = validateEquipment();

    if (hasErrors) {
      // Find the first error message
      const firstErrorKey = Object.keys(fieldErrors).find(key => fieldErrors[key] && fieldErrors[key].length > 0);
      const errorMessage = firstErrorKey ? fieldErrors[firstErrorKey] : 'Please fix all validation errors';

      // Show toast notification with the first error
      showToast(errorMessage, 'error', 5000);

      // Scroll to first error
      const firstErrorElement = document.querySelector('.error-border');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setFieldErrors({});
    generateQuotationPDF();
  };

  // Clear errors when user makes changes
  useEffect(() => {
    setFieldErrors({});
  }, [
    freeQuoteSelectedPanel,
    freeQuotePanelQuantity,
    freeQuoteSelectedInverter,
    freeQuoteInverterQuantity,
    freeQuoteSelectedBattery,
    freeQuoteBatteryQuantity,
    freeQuoteSelectedMountingStructure,
    freeQuoteMountingStructureQuantity,
    freeQuoteSelectedElectricalComponents,
    freeQuoteSelectedCables,
    freeQuoteSelectedJunctionBoxes,
    freeQuoteSelectedDisconnectSwitches,
    freeQuoteSelectedMeters,
    freeQuoteAdditionalEquipment,
  ]);

  // Check if button should be disabled
  const isButtonDisabled = generatingPDF || !freeQuoteForm.systemSize || freeQuoteCalculatedCosts.totalSystemCost === 0;

  // Helper function to check if a field has error
  const hasError = (fieldName) => {
    return fieldErrors[fieldName] && fieldErrors[fieldName].length > 0;
  };

  // Helper function to get error message for a field
  const getError = (fieldName) => {
    return fieldErrors[fieldName] || '';
  };

  // Calculate discounted total
  const { discountAmount, finalAmount } = freeQuoteCalculatedCosts;
  // Calculate ROI whenever values change
  useEffect(() => {
    const totalCost = discountPercentage > 0 ? finalAmount : freeQuoteCalculatedCosts.totalSystemCost;
    const annualProd = annualProduction || 0;

    if (annualProd > 0 && totalCost > 0) {
      const calculatedROI = totalCost / annualProd;
      const roundedROI = Math.round(calculatedROI * 10) / 10;
      // Call the callback with the calculated ROI
      if (onROICalculated) {
        onROICalculated(roundedROI);
      }
    } else if (annualProd === 0 && totalCost > 0) {
      // No annual production data, use 0
      if (onROICalculated) {
        onROICalculated(0);
      }
    }
  }, [
    discountPercentage,
    finalAmount,
    freeQuoteCalculatedCosts.totalSystemCost,
    annualProduction,
    onROICalculated
  ]);
  return (
    <>
      {/* Toast Notification Component */}
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
        position="bottom-left"
      />

      {/* Solar Panels */}
      <div className="quotation-section">
        <h4>Solar Panels</h4>
        <div className="equipment-selection-row">
          <div className="form-group-enad">
            <select
              className={`assessment-form-select-enad ${hasError('panels') ? 'error-border' : ''}`}
              value={freeQuoteSelectedPanel?._id || ''}
              onChange={(e) => {
                const panel = availablePanels.find(p => p._id === e.target.value);
                setFreeQuoteSelectedPanel(panel);
                if (panel && panel.unit === 'watt') setFreeQuotePanelQuantity(1);
              }}
            >
              <option value="">-- Select Panel --</option>
              {availablePanels.filter(p => p.isActive).map(panel => (
                <option key={panel._id} value={panel._id}>
                  {panel.name} - {panel.brand} - ₱{panel.price.toLocaleString()}/{panel.unit}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-enad">
            <input
              type="number"
              min="1"
              max="999"
              className={`assessment-form-input-enad ${freeQuoteSelectedPanel?.unit !== 'watt' && hasError('panels') ? 'error-border' : ''}`}
              value={freeQuotePanelQuantity}
              onChange={(e) => setFreeQuotePanelQuantity(parseInt(e.target.value) || 0)}
              disabled={freeQuoteSelectedPanel?.unit === 'watt'}
            />
          </div>
          <div className="cost-display">
            <span className="cost-value">{formatCurrency(freeQuoteCalculatedCosts.panelCost)}</span>
          </div>
        </div>
        {freeQuoteSelectedPanel?.unit === 'watt' && (
          <small className="form-hint-enad">Price is per watt. Total calculated based on system size: {freeQuoteForm.systemSize} kWp</small>
        )}
        {hasError('panels') && (
          <small className="form-hint-enad error-hint">{getError('panels')}</small>
        )}
      </div>

      {/* Inverters */}
      <div className="quotation-section">
        <h4>Inverters</h4>
        <div className="equipment-selection-row">
          <div className="form-group-enad">
            <select
              className={`assessment-form-select-enad ${hasError('inverters') ? 'error-border' : ''}`}
              value={freeQuoteSelectedInverter?._id || ''}
              onChange={(e) => {
                const inverter = availableInverters.find(i => i._id === e.target.value);
                setFreeQuoteSelectedInverter(inverter);
              }}
            >
              <option value="">-- Select Inverter --</option>
              {availableInverters.filter(i => i.isActive).map(inverter => (
                <option key={inverter._id} value={inverter._id}>
                  {inverter.name} - {inverter.brand} - ₱{inverter.price.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-enad">
            <input
              type="number"
              min="1"
              max="50"
              className={`assessment-form-input-enad ${hasError('inverters') ? 'error-border' : ''}`}
              value={freeQuoteInverterQuantity}
              onChange={(e) => setFreeQuoteInverterQuantity(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="cost-display">
            <span className="cost-value">{formatCurrency(freeQuoteCalculatedCosts.inverterCost)}</span>
          </div>
        </div>
        {hasError('inverters') && (
          <small className="form-hint-enad error-hint">{getError('inverters')}</small>
        )}
      </div>

      {/* Batteries - Show for Hybrid and Off-Grid */}
      {(systemType === 'hybrid' || systemType === 'off-grid') && (
        <div className="quotation-section">
          <h4>Batteries (Required for {getSystemTypeLabel(systemType)})</h4>
          <div className="equipment-selection-row">
            <div className="form-group-enad">
              <select
                className={`assessment-form-select-enad ${hasError('batteries') ? 'error-border' : ''}`}
                value={freeQuoteSelectedBattery?._id || ''}
                onChange={(e) => {
                  const battery = availableBatteries.find(b => b._id === e.target.value);
                  setFreeQuoteSelectedBattery(battery);
                }}
              >
                <option value="">-- Select Battery --</option>
                {availableBatteries.filter(b => b.isActive).map(battery => (
                  <option key={battery._id} value={battery._id}>
                    {battery.name} - {battery.brand} - ₱{battery.price.toLocaleString()}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group-enad">
              <input
                type="number"
                min="1"
                max="100"
                className={`assessment-form-input-enad ${hasError('batteries') ? 'error-border' : ''}`}
                value={freeQuoteBatteryQuantity}
                onChange={(e) => setFreeQuoteBatteryQuantity(parseInt(e.target.value) || 0)}
              />
            </div>
            <div className="cost-display">
              <span className="cost-value">{formatCurrency(freeQuoteCalculatedCosts.batteryCost)}</span>
            </div>
          </div>
          {hasError('batteries') && (
            <small className="form-hint-enad error-hint">{getError('batteries')}</small>
          )}
        </div>
      )}

      {/* Mounting Structure */}
      <div className="quotation-section">
        <h4>Mounting Structure</h4>
        <div className="equipment-selection-row">
          <div className="form-group-enad">
            <select
              className={`assessment-form-select-enad ${hasError('mounting') ? 'error-border' : ''}`}
              value={freeQuoteSelectedMountingStructure?._id || ''}
              onChange={(e) => {
                const structure = availableMountingStructures.find(m => m._id === e.target.value);
                setFreeQuoteSelectedMountingStructure(structure);
              }}
            >
              <option value="">-- Select Mounting Structure --</option>
              {availableMountingStructures.filter(m => m.isActive).map(structure => (
                <option key={structure._id} value={structure._id}>
                  {structure.name} - {structure.brand} - ₱{structure.price.toLocaleString()}/{structure.unit}
                </option>
              ))}
            </select>
          </div>
          <div className="form-group-enad">
            <input
              type="number"
              min="1"
              max="999"
              className={`assessment-form-input-enad ${hasError('mounting') ? 'error-border' : ''}`}
              value={freeQuoteMountingStructureQuantity}
              onChange={(e) => setFreeQuoteMountingStructureQuantity(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="cost-display">
            <span className="cost-value">{formatCurrency(freeQuoteCalculatedCosts.mountingCost)}</span>
          </div>
        </div>
        {hasError('mounting') && (
          <small className="form-hint-enad error-hint">{getError('mounting')}</small>
        )}
      </div>

      {/* ===== ELECTRICAL COMPONENTS ===== */}
      <div className="quotation-section">
        <h4>Electrical Components</h4>
        <button type="button" className="btn-add-item" onClick={freeQuoteAddElectricalComponent}>+ Add Component</button>
        {freeQuoteSelectedElectricalComponents.map((item, index) => (
          <div key={index} className="additional-item-row">
            <select
              className={`assessment-form-select-enad ${!item.id && hasError('electrical') ? 'error-border' : ''}`}
              value={item.id || ''}
              onChange={(e) => freeQuoteUpdateElectricalComponent(index, 'id', e.target.value)}
            >
              <option value="">-- Select Component --</option>
              {availableElectricalComponents.filter(c => c.isActive).map(comp => (
                <option key={comp._id} value={comp._id}>{comp.name} - ₱{comp.price.toLocaleString()}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qty"
              min="1"
              max="999"
              className={`assessment-form-input-enad ${(item.quantity < 1 || item.quantity > 999) && hasError('electrical') ? 'error-border' : ''}`}
              value={item.quantity}
              onChange={(e) => freeQuoteUpdateElectricalComponent(index, 'quantity', parseInt(e.target.value) || 0)}
            />
            <span className="item-total">{formatCurrency(item.total || 0)}</span>
            <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveElectricalComponent(index)}>Remove</button>
          </div>
        ))}
        {hasError('electrical') && (
          <small className="form-hint-enad error-hint">{getError('electrical')}</small>
        )}
      </div>

      {/* ===== CABLES ===== */}
      <div className="quotation-section">
        <h4>Cables and Wiring</h4>
        <button type="button" className="btn-add-item" onClick={freeQuoteAddCable}>+ Add Cable</button>
        {freeQuoteSelectedCables.map((item, index) => (
          <div key={index} className="additional-item-row">
            <select
              className={`assessment-form-select-enad ${!item.id && hasError('cables') ? 'error-border' : ''}`}
              value={item.id || ''}
              onChange={(e) => freeQuoteUpdateCable(index, 'id', e.target.value)}
            >
              <option value="">-- Select Cable Type --</option>
              {availableCables.filter(c => c.isActive).map(cable => (
                <option key={cable._id} value={cable._id}>{cable.name} - ₱{cable.price.toLocaleString()}/{cable.unit}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Length (m)"
              min="0.5"
              max="10000"
              step="0.5"
              className={`assessment-form-input-enad ${(item.length < 0.5 || item.length > 10000) && hasError('cables') ? 'error-border' : ''}`}
              value={item.length}
              onChange={(e) => freeQuoteUpdateCable(index, 'length', parseFloat(e.target.value) || 0)}
            />
            <input
              type="number"
              placeholder="Qty"
              min="1"
              max="999"
              className={`assessment-form-input-enad ${(item.quantity < 1 || item.quantity > 999) && hasError('cables') ? 'error-border' : ''}`}
              value={item.quantity}
              onChange={(e) => freeQuoteUpdateCable(index, 'quantity', parseInt(e.target.value) || 0)}
            />
            <span className="item-total">{formatCurrency(item.total || 0)}</span>
            <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveCable(index)}>Remove</button>
          </div>
        ))}
        {hasError('cables') && (
          <small className="form-hint-enad error-hint">{getError('cables')}</small>
        )}
      </div>

      {/* ===== JUNCTION BOXES ===== */}
      <div className="quotation-section">
        <h4>Junction Boxes</h4>
        <button type="button" className="btn-add-item" onClick={freeQuoteAddJunctionBox}>+ Add Junction Box</button>
        {freeQuoteSelectedJunctionBoxes.map((item, index) => (
          <div key={index} className="additional-item-row">
            <select
              className={`assessment-form-select-enad ${!item.id && hasError('junctionBoxes') ? 'error-border' : ''}`}
              value={item.id || ''}
              onChange={(e) => freeQuoteUpdateJunctionBox(index, 'id', e.target.value)}
            >
              <option value="">-- Select Junction Box --</option>
              {availableJunctionBoxes.filter(j => j.isActive).map(box => (
                <option key={box._id} value={box._id}>{box.name} - ₱{box.price.toLocaleString()}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qty"
              min="1"
              max="999"
              className={`assessment-form-input-enad ${(item.quantity < 1 || item.quantity > 999) && hasError('junctionBoxes') ? 'error-border' : ''}`}
              value={item.quantity}
              onChange={(e) => freeQuoteUpdateJunctionBox(index, 'quantity', parseInt(e.target.value) || 0)}
            />
            <span className="item-total">{formatCurrency(item.total || 0)}</span>
            <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveJunctionBox(index)}>Remove</button>
          </div>
        ))}
        {hasError('junctionBoxes') && (
          <small className="form-hint-enad error-hint">{getError('junctionBoxes')}</small>
        )}
      </div>

      {/* ===== DISCONNECT SWITCHES ===== */}
      <div className="quotation-section">
        <h4>Disconnect Switches</h4>
        <button type="button" className="btn-add-item" onClick={freeQuoteAddDisconnectSwitch}>+ Add Switch</button>
        {freeQuoteSelectedDisconnectSwitches.map((item, index) => (
          <div key={index} className="additional-item-row">
            <select
              className={`assessment-form-select-enad ${!item.id && hasError('disconnectSwitches') ? 'error-border' : ''}`}
              value={item.id || ''}
              onChange={(e) => freeQuoteUpdateDisconnectSwitch(index, 'id', e.target.value)}
            >
              <option value="">-- Select Switch --</option>
              {availableDisconnectSwitches.filter(s => s.isActive).map(sw => (
                <option key={sw._id} value={sw._id}>{sw.name} - ₱{sw.price.toLocaleString()}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qty"
              min="1"
              max="999"
              className={`assessment-form-input-enad ${(item.quantity < 1 || item.quantity > 999) && hasError('disconnectSwitches') ? 'error-border' : ''}`}
              value={item.quantity}
              onChange={(e) => freeQuoteUpdateDisconnectSwitch(index, 'quantity', parseInt(e.target.value) || 0)}
            />
            <span className="item-total">{formatCurrency(item.total || 0)}</span>
            <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveDisconnectSwitch(index)}>Remove</button>
          </div>
        ))}
        {hasError('disconnectSwitches') && (
          <small className="form-hint-enad error-hint">{getError('disconnectSwitches')}</small>
        )}
      </div>

      {/* ===== METERS ===== */}
      <div className="quotation-section">
        <h4>Meters</h4>
        <button type="button" className="btn-add-item" onClick={freeQuoteAddMeter}>+ Add Meter</button>
        {freeQuoteSelectedMeters.map((item, index) => (
          <div key={index} className="additional-item-row">
            <select
              className={`assessment-form-select-enad ${!item.id && hasError('meters') ? 'error-border' : ''}`}
              value={item.id || ''}
              onChange={(e) => freeQuoteUpdateMeter(index, 'id', e.target.value)}
            >
              <option value="">-- Select Meter --</option>
              {availableMeters.filter(m => m.isActive).map(meter => (
                <option key={meter._id} value={meter._id}>{meter.name} - ₱{meter.price.toLocaleString()}</option>
              ))}
            </select>
            <input
              type="number"
              placeholder="Qty"
              min="1"
              max="999"
              className={`assessment-form-input-enad ${(item.quantity < 1 || item.quantity > 999) && hasError('meters') ? 'error-border' : ''}`}
              value={item.quantity}
              onChange={(e) => freeQuoteUpdateMeter(index, 'quantity', parseInt(e.target.value) || 0)}
            />
            <span className="item-total">{formatCurrency(item.total || 0)}</span>
            <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveMeter(index)}>Remove</button>
          </div>
        ))}
        {hasError('meters') && (
          <small className="form-hint-enad error-hint">{getError('meters')}</small>
        )}
      </div>

      {/* ===== ADDITIONAL EQUIPMENT ===== */}
      <div className="quotation-section">
        <h4>Additional Equipment</h4>
        <button type="button" className="btn-add-item" onClick={freeQuoteAddAdditionalEquipment}>+ Add Custom Item</button>
        {freeQuoteAdditionalEquipment.map((item, index) => (
          <div key={index} className="additional-item-row">
            <input
              type="text"
              placeholder="Item name"
              className={`assessment-form-input-enad ${item.name && !item.name.trim() && hasError('additional') ? 'error-border' : ''}`}
              value={item.name}
              onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'name', e.target.value)}
            />
            <input
              type="number"
              placeholder="Qty"
              min="1"
              max="999"
              className={`assessment-form-input-enad ${item.name && item.quantity < 1 && hasError('additional') ? 'error-border' : ''}`}
              value={item.quantity}
              onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'quantity', parseInt(e.target.value) || 0)}
            />
            <input
              type="number"
              placeholder="Price"
              min="0.01"
              step="0.01"
              className={`assessment-form-input-enad ${item.name && item.price < 0.01 && hasError('additional') ? 'error-border' : ''}`}
              value={item.price}
              onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'price', parseFloat(e.target.value) || 0)}
            />
            <span className="item-total">{formatCurrency(item.total || 0)}</span>
            <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveAdditionalEquipment(index)}>Remove</button>
          </div>
        ))}
        {hasError('additional') && (
          <small className="form-hint-enad error-hint">{getError('additional')}</small>
        )}
      </div>

      {/* Installation Labor */}
      <div className="quotation-section">
        <h4>Installation Labor</h4>
        <div className="labor-percentage-control">
          <div className="labor-control-group">
            <div>
              <label className="form-label-enad">Labor Cost (%)</label>
              <input
                type="number"
                step="1"
                min="0"
                max="100"
                className="assessment-form-input-enad labor-input"
                value={laborCostPercentage}
                onChange={(e) => {
                  const value = parseInt(e.target.value) || 0;
                  setLaborCostPercentage(Math.min(100, Math.max(0, value)));
                  setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
                }}
              />
              <small className="form-hint-enad">Default: 20% of total equipment cost</small>
            </div>
          </div>
        </div>
        <div className="labor-calculation">
          <div className="labor-detail">
            <span>Total Equipment Cost:</span>
            <span>{formatCurrency(freeQuoteCalculatedCosts.totalEquipmentCost)}</span>
          </div>
          <div className="labor-detail">
            <span>Labor Cost ({laborCostPercentage}%):</span>
            <span>{formatCurrency(freeQuoteCalculatedCosts.installationLaborCost)}</span>
          </div>
          <div className="labor-total">
            <strong>Subtotal (Equipment + Labor)</strong>
            <strong>{formatCurrency(freeQuoteCalculatedCosts.subtotalCost)}</strong>
          </div>
        </div>
      </div>

      {/* Overhead & Contingency */}
      <div className="quotation-section">
        <h4>Overhead & Contingency</h4>
        <div className="cost-percentage-control">
          <div>
            <label className="form-label-enad">Overhead & Contingency (% of Subtotal)</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              className="assessment-form-input-enad overhead-input"
              value={overheadContingencyPercentage}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setOverheadContingencyPercentage(Math.min(100, Math.max(0, value)));
                setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
              }}
            />
            <small className="form-hint-enad">Default: 15% of subtotal (Equipment + Labor)</small>
          </div>
        </div>
        <div className="cost-calculation">
          <div className="cost-detail">
            <span>Subtotal (Equipment + Labor):</span>
            <span>{formatCurrency(freeQuoteCalculatedCosts.subtotalCost)}</span>
          </div>
          <div className="cost-detail">
            <span>Overhead & Contingency ({overheadContingencyPercentage}%):</span>
            <span>{formatCurrency(freeQuoteCalculatedCosts.overheadContingencyCost)}</span>
          </div>
        </div>
      </div>

      {/* Contractor Profit */}
      <div className="quotation-section">
        <h4>Contractor Profit</h4>
        <div className="cost-percentage-control">
          <div>
            <label className="form-label-enad">Contractor Profit (% of Subtotal)</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              className="assessment-form-input-enad profit-input"
              value={contractorProfitPercentage}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setContractorProfitPercentage(Math.min(100, Math.max(0, value)));
                setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
              }}
            />
            <small className="form-hint-enad">Default: 10% of subtotal (Equipment + Labor)</small>
          </div>
        </div>
        <div className="cost-calculation">
          <div className="cost-detail">
            <span>Subtotal (Equipment + Labor):</span>
            <span>{formatCurrency(freeQuoteCalculatedCosts.subtotalCost)}</span>
          </div>
          <div className="cost-detail">
            <span>Contractor Profit ({contractorProfitPercentage}%):</span>
            <span>{formatCurrency(freeQuoteCalculatedCosts.contractorProfitCost)}</span>
          </div>
        </div>
      </div>

      {/* ===== NEW: DISCOUNT SECTION ===== */}
      <div className="quotation-section discount-section">
        <h4>Discount</h4>
        <div className="cost-percentage-control">
          <div>
            <label className="form-label-enad">Discount (% of Total System Cost)</label>
            <input
              type="number"
              step="1"
              min="0"
              max="100"
              className="assessment-form-input-enad discount-input"
              value={discountPercentage}
              onChange={(e) => {
                const value = parseInt(e.target.value) || 0;
                setDiscountPercentage(Math.min(100, Math.max(0, value)));
                setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
              }}
            />
            <small className="form-hint-enad">Enter discount percentage to apply to the total system cost</small>
          </div>
        </div>

        {discountPercentage > 0 && (
          <div className="cost-calculation discount-calculation">
            <div className="cost-detail">
              <span>Total System Cost:</span>
              <span>{formatCurrency(freeQuoteCalculatedCosts.totalSystemCost)}</span>
            </div>
            <div className="cost-detail discount-amount">
              <span>Discount ({discountPercentage}%):</span>
              <span className="discount-value">-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="cost-detail highlight-discount">
              <strong>Discounted Total:</strong>
              <strong>{formatCurrency(finalAmount)}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Complete Cost Summary */}
      <div className="cost-summary-large">
        <h3>Complete Cost Summary</h3>
        <div className="summary-row"><span>Solar Panels:</span><span>{formatCurrency(freeQuoteCalculatedCosts.panelCost)}</span></div>
        <div className="summary-row"><span>Inverters:</span><span>{formatCurrency(freeQuoteCalculatedCosts.inverterCost)}</span></div>
        <div className="summary-row"><span>Batteries:</span><span>{formatCurrency(freeQuoteCalculatedCosts.batteryCost)}</span></div>
        <div className="summary-row"><span>Mounting Structure:</span><span>{formatCurrency(freeQuoteCalculatedCosts.mountingCost)}</span></div>
        <div className="summary-row"><span>Electrical Components:</span><span>{formatCurrency(freeQuoteCalculatedCosts.electricalCost)}</span></div>
        <div className="summary-row"><span>Cables and Wiring:</span><span>{formatCurrency(freeQuoteCalculatedCosts.cableCost)}</span></div>
        <div className="summary-row"><span>Junction Boxes:</span><span>{formatCurrency(freeQuoteCalculatedCosts.junctionBoxCost)}</span></div>
        <div className="summary-row"><span>Disconnect Switches:</span><span>{formatCurrency(freeQuoteCalculatedCosts.disconnectSwitchCost)}</span></div>
        <div className="summary-row"><span>Meters:</span><span>{formatCurrency(freeQuoteCalculatedCosts.meterCost)}</span></div>
        <div className="summary-row"><span>Additional Equipment:</span><span>{formatCurrency(freeQuoteCalculatedCosts.additionalCost)}</span></div>
        <div className="summary-row"><span>Equipment Total:</span><span>{formatCurrency(freeQuoteCalculatedCosts.totalEquipmentCost)}</span></div>
        <div className="summary-row"><span>Installation Labor ({laborCostPercentage}%):</span><span>{formatCurrency(freeQuoteCalculatedCosts.installationLaborCost)}</span></div>
        <div className="summary-row"><span>Subtotal (Equipment + Labor):</span><span>{formatCurrency(freeQuoteCalculatedCosts.subtotalCost)}</span></div>
        <div className="summary-row"><span>Overhead & Contingency ({overheadContingencyPercentage}%):</span><span>{formatCurrency(freeQuoteCalculatedCosts.overheadContingencyCost)}</span></div>
        <div className="summary-row"><span>Contractor Profit ({contractorProfitPercentage}%):</span><span>{formatCurrency(freeQuoteCalculatedCosts.contractorProfitCost)}</span></div>
        <div className="summary-row total"><span>TOTAL SYSTEM COST:</span><span>{formatCurrency(freeQuoteCalculatedCosts.totalSystemCost)}</span></div>

        {/* Discount in Summary */}
        {discountPercentage > 0 && (
          <>
            <div className="summary-row discount-row">
              <span>Discount ({discountPercentage}%):</span>
              <span className="discount-value">-{formatCurrency(discountAmount)}</span>
            </div>
            <div className="summary-row grand-total">
              <span>FINAL TOTAL (After Discount):</span>
              <span>{formatCurrency(finalAmount)}</span>
            </div>
          </>
        )}

        {hasError('totalCost') && (
          <small className="form-hint-enad error-hint" style={{ marginTop: '0.5rem', display: 'block' }}>{getError('totalCost')}</small>
        )}
      </div>

      {/* ROI Data */}
      {freeQuoteCalculatedCosts.totalSystemCost > 0 && annualProduction > 0 && (
        <div className="quotation-section roi-section">
          <h4>ROI Data</h4>
          <div className="cost-calculation">
            <div className="cost-detail">
              <span>Total Cost:</span>
              <span>{formatCurrency(discountPercentage > 0 ? finalAmount : freeQuoteCalculatedCosts.totalSystemCost)}</span>
            </div>
            <div className="cost-detail">
              <span>Annual Production:</span>
              <span>{annualProduction.toLocaleString()} kWh/year</span>
            </div>
            <div className="cost-detail highlight-roi">
              <span>ROI (Payback Period):</span>
              <span>
                {(discountPercentage > 0 ? finalAmount : freeQuoteCalculatedCosts.totalSystemCost) > 0 && annualProduction > 0
                  ? ((discountPercentage > 0 ? finalAmount : freeQuoteCalculatedCosts.totalSystemCost) / annualProduction).toFixed(1)
                  : '—'} years
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Payment Terms & Remarks */}
      <div className="form-group-enad">
        <label className="form-label-enad">Payment Terms</label>
        <textarea
          className="assessment-form-textarea-enad"
          value={freeQuoteForm.paymentTerms}
          onChange={(e) => handleFreeQuoteFormChange('paymentTerms', e.target.value)}
          rows={2}
          placeholder="e.g., 30% down payment, 70% upon completion"
        />
      </div>
      <div className="form-group-enad">
        <label className="form-label-enad">Remarks</label>
        <textarea
          className="assessment-form-textarea-enad"
          value={freeQuoteForm.remarks}
          onChange={(e) => handleFreeQuoteFormChange('remarks', e.target.value)}
          rows={2}
          placeholder="Additional notes or special instructions"
        />
      </div>

      <div className="action-buttons-enad">
        <button
          onClick={handleGeneratePDF}
          disabled={isButtonDisabled}
          className="btn-primary-enad"
        >
          {generatingPDF ? 'Generating...' : 'Generate and Upload PDF'}
        </button>
      </div>
    </>
  );
};