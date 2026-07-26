// components/Engineer/SystemEquipmentSelection.jsx
import React from 'react';

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
  freeQuoteCalculateTotalCosts,
  // Form
  freeQuoteForm,
  handleFreeQuoteFormChange,
  // System Type
  systemType,
  getSystemTypeLabel,

  annualProduction,
  roiData,
  // Utility
  formatCurrency,
  generateQuotationPDF,
  generatingPDF,


}) => (

  <>

    {/* Solar Panels */}
    <div className="quotation-section">
      <h4>Solar Panels</h4>
      <div className="equipment-selection-row">
        <div className="form-group-enad">
          <select
            className="assessment-form-select-enad"
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
            className="assessment-form-input-enad"
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
    </div>

    {/* Inverters */}
    <div className="quotation-section">
      <h4>Inverters</h4>
      <div className="equipment-selection-row">
        <div className="form-group-enad">
          <select
            className="assessment-form-select-enad"
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
            className="assessment-form-input-enad"
            value={freeQuoteInverterQuantity}
            onChange={(e) => setFreeQuoteInverterQuantity(parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="cost-display">
          <span className="cost-value">{formatCurrency(freeQuoteCalculatedCosts.inverterCost)}</span>
        </div>
      </div>
    </div>

    {/* Batteries - Show for Hybrid and Off-Grid */}
    {(systemType === 'hybrid' || systemType === 'off-grid') && (
      <div className="quotation-section">
        <h4>Batteries (Required for {getSystemTypeLabel(systemType)})</h4>
        <div className="equipment-selection-row">
          <div className="form-group-enad">
            <select
              className="assessment-form-select-enad"
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
              min="0"
              className="assessment-form-input-enad"
              value={freeQuoteBatteryQuantity}
              onChange={(e) => setFreeQuoteBatteryQuantity(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="cost-display">
            <span className="cost-value">{formatCurrency(freeQuoteCalculatedCosts.batteryCost)}</span>
          </div>
        </div>
      </div>
    )}

    {/* Mounting Structure */}
    <div className="quotation-section">
      <h4>Mounting Structure</h4>
      <div className="equipment-selection-row">
        <div className="form-group-enad">
          <select className="assessment-form-select-enad" value={freeQuoteSelectedMountingStructure?._id || ''} onChange={(e) => { const structure = availableMountingStructures.find(m => m._id === e.target.value); setFreeQuoteSelectedMountingStructure(structure); }}>
            <option value="">-- Select Mounting Structure --</option>
            {availableMountingStructures.filter(m => m.isActive).map(structure => (<option key={structure._id} value={structure._id}>{structure.name} - {structure.brand} - ₱{structure.price.toLocaleString()}/{structure.unit}</option>))}
          </select>
        </div>
        <div className="form-group-enad">
          <input type="number" min="1" className="assessment-form-input-enad" value={freeQuoteMountingStructureQuantity} onChange={(e) => setFreeQuoteMountingStructureQuantity(parseInt(e.target.value) || 0)} />
        </div>
        <div className="cost-display"><span className="cost-value">{formatCurrency(freeQuoteCalculatedCosts.mountingCost)}</span></div>
      </div>
    </div>

    {/* ===== ELECTRICAL COMPONENTS ===== */}
    <div className="quotation-section">
      <h4>Electrical Components</h4>
      <button type="button" className="btn-add-item" onClick={freeQuoteAddElectricalComponent}>+ Add Component</button>
      {freeQuoteSelectedElectricalComponents.map((item, index) => (
        <div key={index} className="additional-item-row">
          <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => freeQuoteUpdateElectricalComponent(index, 'id', e.target.value)}>
            <option value="">-- Select Component --</option>
            {availableElectricalComponents.filter(c => c.isActive).map(comp => (
              <option key={comp._id} value={comp._id}>{comp.name} - ₱{comp.price.toLocaleString()}</option>
            ))}
          </select>
          <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateElectricalComponent(index, 'quantity', parseInt(e.target.value) || 0)} />
          <span className="item-total">{formatCurrency(item.total || 0)}</span>
          <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveElectricalComponent(index)}>Remove</button>
        </div>
      ))}
    </div>

    {/* ===== CABLES ===== */}
    <div className="quotation-section">
      <h4>Cables and Wiring</h4>
      <button type="button" className="btn-add-item" onClick={freeQuoteAddCable}>+ Add Cable</button>
      {freeQuoteSelectedCables.map((item, index) => (
        <div key={index} className="additional-item-row">
          <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => freeQuoteUpdateCable(index, 'id', e.target.value)}>
            <option value="">-- Select Cable Type --</option>
            {availableCables.filter(c => c.isActive).map(cable => (
              <option key={cable._id} value={cable._id}>{cable.name} - ₱{cable.price.toLocaleString()}/{cable.unit}</option>
            ))}
          </select>
          <input type="number" placeholder="Length (m)" className="assessment-form-input-enad" value={item.length} onChange={(e) => freeQuoteUpdateCable(index, 'length', parseFloat(e.target.value) || 0)} />
          <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateCable(index, 'quantity', parseInt(e.target.value) || 0)} />
          <span className="item-total">{formatCurrency(item.total || 0)}</span>
          <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveCable(index)}>Remove</button>
        </div>
      ))}
    </div>

    {/* ===== JUNCTION BOXES ===== */}
    <div className="quotation-section">
      <h4>Junction Boxes</h4>
      <button type="button" className="btn-add-item" onClick={freeQuoteAddJunctionBox}>+ Add Junction Box</button>
      {freeQuoteSelectedJunctionBoxes.map((item, index) => (
        <div key={index} className="additional-item-row">
          <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => freeQuoteUpdateJunctionBox(index, 'id', e.target.value)}>
            <option value="">-- Select Junction Box --</option>
            {availableJunctionBoxes.filter(j => j.isActive).map(box => (
              <option key={box._id} value={box._id}>{box.name} - ₱{box.price.toLocaleString()}</option>
            ))}
          </select>
          <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateJunctionBox(index, 'quantity', parseInt(e.target.value) || 0)} />
          <span className="item-total">{formatCurrency(item.total || 0)}</span>
          <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveJunctionBox(index)}>Remove</button>
        </div>
      ))}
    </div>

    {/* ===== DISCONNECT SWITCHES ===== */}
    <div className="quotation-section">
      <h4>Disconnect Switches</h4>
      <button type="button" className="btn-add-item" onClick={freeQuoteAddDisconnectSwitch}>+ Add Switch</button>
      {freeQuoteSelectedDisconnectSwitches.map((item, index) => (
        <div key={index} className="additional-item-row">
          <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => freeQuoteUpdateDisconnectSwitch(index, 'id', e.target.value)}>
            <option value="">-- Select Switch --</option>
            {availableDisconnectSwitches.filter(s => s.isActive).map(sw => (
              <option key={sw._id} value={sw._id}>{sw.name} - ₱{sw.price.toLocaleString()}</option>
            ))}
          </select>
          <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateDisconnectSwitch(index, 'quantity', parseInt(e.target.value) || 0)} />
          <span className="item-total">{formatCurrency(item.total || 0)}</span>
          <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveDisconnectSwitch(index)}>Remove</button>
        </div>
      ))}
    </div>

    {/* ===== METERS ===== */}
    <div className="quotation-section">
      <h4>Meters</h4>
      <button type="button" className="btn-add-item" onClick={freeQuoteAddMeter}>+ Add Meter</button>
      {freeQuoteSelectedMeters.map((item, index) => (
        <div key={index} className="additional-item-row">
          <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => freeQuoteUpdateMeter(index, 'id', e.target.value)}>
            <option value="">-- Select Meter --</option>
            {availableMeters.filter(m => m.isActive).map(meter => (
              <option key={meter._id} value={meter._id}>{meter.name} - ₱{meter.price.toLocaleString()}</option>
            ))}
          </select>
          <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateMeter(index, 'quantity', parseInt(e.target.value) || 0)} />
          <span className="item-total">{formatCurrency(item.total || 0)}</span>
          <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveMeter(index)}>Remove</button>
        </div>
      ))}
    </div>

    {/* ===== ADDITIONAL EQUIPMENT ===== */}
    <div className="quotation-section">
      <h4>Additional Equipment</h4>
      <button type="button" className="btn-add-item" onClick={freeQuoteAddAdditionalEquipment}>+ Add Custom Item</button>
      {freeQuoteAdditionalEquipment.map((item, index) => (
        <div key={index} className="additional-item-row">
          <input type="text" placeholder="Item name" className="assessment-form-input-enad" value={item.name} onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'name', e.target.value)} />
          <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'quantity', parseInt(e.target.value) || 0)} />
          <input type="number" placeholder="Price" className="assessment-form-input-enad" value={item.price} onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'price', parseFloat(e.target.value) || 0)} />
          <span className="item-total">{formatCurrency(item.total || 0)}</span>
          <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveAdditionalEquipment(index)}>Remove</button>
        </div>
      ))}
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
    </div>
    {/* ROI Data */}
    {freeQuoteCalculatedCosts.totalSystemCost > 0 && annualProduction > 0 && (
      <div className="quotation-section roi-section">
        <h4>ROI Data</h4>
        <div className="cost-calculation">
          <div className="cost-detail">
            <span>Total Cost:</span>
            <span>{formatCurrency(freeQuoteCalculatedCosts.totalSystemCost)}</span>
          </div>
          <div className="cost-detail">
            <span>Annual Production:</span>
            <span>{annualProduction.toLocaleString()} kWh/year</span>
          </div>
          <div className="cost-detail highlight-roi">
            <span>ROI (Payback Period):</span>
            <span>
              {freeQuoteCalculatedCosts.totalSystemCost > 0 && annualProduction > 0
                ? (freeQuoteCalculatedCosts.totalSystemCost / annualProduction).toFixed(1)
                : '—'} years
            </span>
          </div>
        </div>
      </div>
    )}
    {/* Payment Terms & Remarks */}
    <div className="form-group-enad">
      <label className="form-label-enad">Payment Terms</label>
      <textarea className="assessment-form-textarea-enad" value={freeQuoteForm.paymentTerms} onChange={(e) => handleFreeQuoteFormChange('paymentTerms', e.target.value)} rows={2} placeholder="e.g., 30% down payment, 70% upon completion" />
    </div>
    <div className="form-group-enad">
      <label className="form-label-enad">Remarks</label>
      <textarea className="assessment-form-textarea-enad" value={freeQuoteForm.remarks} onChange={(e) => handleFreeQuoteFormChange('remarks', e.target.value)} rows={2} placeholder="Additional notes or special instructions" />
    </div>

    <div className="action-buttons-enad">
      <button onClick={generateQuotationPDF} disabled={generatingPDF || !freeQuoteForm.systemSize || freeQuoteCalculatedCosts.totalSystemCost === 0} className="btn-primary-enad">
        {generatingPDF ? 'Generating...' : 'Generate and Upload PDF'}
      </button>
    </div>
  </>
);