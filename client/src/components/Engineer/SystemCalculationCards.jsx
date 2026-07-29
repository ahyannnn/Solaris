// components/Engineer/SystemCalculationCards.jsx
import React from 'react';

// Safe number formatting helper - now defaults to 2 decimal places
const safeToFixed = (value, decimals = 2) => {
  if (value === undefined || value === null || isNaN(value)) return '0';
  return Number(value).toFixed(decimals);
};

// Helper to get panel wattage from equipment
const getPanelWattage = (panel) => {
  if (!panel) return 550;
  if (panel.capacity?.value) return panel.capacity.value;
  return panel.power || 550;
};

// Helper to get panel area from equipment
const getPanelArea = (panel) => {
  if (!panel) return 2.5;
  return panel.panelArea || panel.area || 2.5;
};

// Helper to get DOD from battery
const getDepthOfDischarge = (battery) => {
  if (!battery) return 0.8;
  return battery.dob || 0.8;
};

// Area Calculation Card - Auto-populated from database
export const AreaCalculationCard = ({
  roofLength,
  roofWidth,
  roofArea,
  selectedPanelForCalc, setSelectedPanelForCalc,
  availablePanels,
  calculateByArea,
  isDataLoaded
}) => {
  const panelWattage = getPanelWattage(selectedPanelForCalc);
  const panelArea = getPanelArea(selectedPanelForCalc);

  return (
    <div className="calculation-card">
      <div className="calculation-card-header">
        <h4>Based on Area</h4>
        <span className="calculation-badge">Grid-Tie • Off-Grid</span>
      </div>
      <div className="calculation-card-body">
        <div className="consumption-display">
          <div className="consumption-item">
            <label>Roof Length</label>
            <strong>{safeToFixed(roofLength)} m</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item">
            <label>Roof Width</label>
            <strong>{safeToFixed(roofWidth)} m</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item highlight">
            <label>Total Roof Area</label>
            <strong>{safeToFixed(roofArea)} m²</strong>
            <small>Length × Width</small>
          </div>
          {roofArea > 0 && (
            <div className="consumption-item">
              <label>Usable Area (70%)</label>
              <strong>{safeToFixed(roofArea * 0.7)} m²</strong>
              <small>70% of total roof area</small>
            </div>
          )}
        </div>

        <div className="form-group-enad">
          <label className="form-label-enad">Select Solar Panel</label>
          <select
            className="assessment-form-select-enad"
            value={selectedPanelForCalc?._id || ''}
            onChange={(e) => {
              const panel = availablePanels.find(p => p._id === e.target.value);
              setSelectedPanelForCalc(panel);
            }}
          >
            <option value="">-- Select Panel --</option>
            {availablePanels.filter(p => p.isActive).map(panel => {
              const wattage = getPanelWattage(panel);
              const area = getPanelArea(panel);
              return (
                <option key={panel._id} value={panel._id}>
                  {panel.name} - {wattage}W - {safeToFixed(area)}m²
                </option>
              );
            })}
          </select>
        </div>

        {selectedPanelForCalc && (
          <div className="selected-equipment-info">
            <div className="equipment-detail">
              <span>Panel Power: <strong>{panelWattage}W</strong></span>
              <span>Panel Area: <strong>{safeToFixed(panelArea)}m²</strong></span>
            </div>
          </div>
        )}

        <div className="formula-display">
          <label className="form-label-enad"><strong>Formula:</strong> (Roof Area × 70% × PV Power(W)) / Panel Area(m²)</label>
        </div>

        <button
          className="btn-calculate"
          onClick={calculateByArea}
          disabled={!isDataLoaded || roofArea === 0 || !selectedPanelForCalc}
        >
          Calculate System Size
        </button>

        {!isDataLoaded && (
          <small className="form-hint-enad error-hint">No roof dimension data available. Please check client data.</small>
        )}
        {isDataLoaded && roofArea === 0 && (
          <small className="form-hint-enad error-hint">Roof dimensions not provided by client.</small>
        )}
      </div>
    </div>
  );
};

// Electricity Calculation Card - Read-only Target Savings
export const ElectricityCalculationCard = ({
  totalDailyConsumption,
  dayConsumption,
  nightConsumption,
  ratePerKwh,
  monthlyBill,
  pshValue, setPshValue,
  targetSavings,        // Read-only - comes from database
  selectedPanelForCalc, setSelectedPanelForCalc,
  availablePanels,
  calculateByElectricity,
  isDataLoaded,
  selectedBatteryForCalc,
  batteryAutonomy,
  setBatteryAutonomy,
  systemType
}) => {
  const panelWattage = getPanelWattage(selectedPanelForCalc);
  const dod = getDepthOfDischarge(selectedBatteryForCalc);

  // Only show battery autonomy for Hybrid (not for Grid-Tie or Off-Grid)
  const showBatteryAutonomy = systemType === 'hybrid';

  return (
    <div className="calculation-card">
      <div className="calculation-card-header">
        <h4>Based on Electricity Bill</h4>
        <span className="calculation-badge">Grid-Tie • Hybrid • Off-Grid</span>
      </div>
      <div className="calculation-card-body">
        <div className="consumption-display">
          <div className="consumption-item">
            <label>Total Daily Consumption</label>
            <strong>{safeToFixed(totalDailyConsumption)} kWh/day</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item">
            <label>Day Consumption</label>
            <strong>{safeToFixed(dayConsumption)} kWh</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item">
            <label>Night Consumption</label>
            <strong>{safeToFixed(nightConsumption)} kWh</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item">
            <label>Rate per kWh</label>
            <strong>₱{safeToFixed(ratePerKwh, 2)}</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item highlight">
            <label>Monthly Bill</label>
            <strong>₱{safeToFixed(monthlyBill, 2)}</strong>
            <small>From client data</small>
          </div>
        </div>

        <div className="calculation-params">
          <div className="param-group">
            <label>PSH (Peak Sun Hours)</label>
            <input
              type="number"
              step="0.1"
              value={pshValue}
              onChange={(e) => setPshValue(parseFloat(e.target.value) || 3.5)}
              className="param-input"
            />
            <small className="form-hint-enad">Default: 3.5 for Philippines</small>
          </div>
          {/* Target Savings - Read-only (from database) */}
          {(systemType === 'grid-tie' || systemType === 'hybrid') && (
            <div className="param-group">
              <label>Target Savings (%)</label>
              <div className="param-display read-only">{targetSavings}%</div>
              <small className="form-hint-enad">From client's energy profile</small>
            </div>
          )}
          {systemType === 'off-grid' && (
            <div className="param-group">
              <label>Target Savings</label>
              <div className="param-display read-only">100% (Required)</div>
              <small className="form-hint-enad">Off-grid systems must cover 100% of consumption</small>
            </div>
          )}
        </div>

        {/* Battery Autonomy - Only for Hybrid */}
        {showBatteryAutonomy && (
          <div className="battery-autonomy-selector">
            <label className="form-label-enad">Battery Autonomy (Days)</label>
            <div className="autonomy-options">
              <button
                className={`autonomy-btn ${batteryAutonomy === 1 ? 'active' : ''}`}
                onClick={() => setBatteryAutonomy(1)}
              >
                1 Day
              </button>
              <button
                className={`autonomy-btn ${batteryAutonomy === 2 ? 'active' : ''}`}
                onClick={() => setBatteryAutonomy(2)}
              >
                2 Days
              </button>
              <button
                className={`autonomy-btn ${batteryAutonomy === 3 ? 'active' : ''}`}
                onClick={() => setBatteryAutonomy(3)}
              >
                3 Days
              </button>
            </div>
            <small className="form-hint-enad">Number of days the battery can power the load without solar input</small>
          </div>
        )}

        {/* Grid-Tie Note */}
        {systemType === 'grid-tie' && (
          <div className="system-note gridtie-note">
            <p>Grid-tie systems do not require battery storage. They use the grid as backup.</p>
          </div>
        )}

        {/* Off-Grid Note */}
        {systemType === 'off-grid' && (
          <div className="system-note offgrid-note">
            <p>⚠️ Off-grid systems require battery storage. Battery size will be calculated based on total daily consumption.</p>
          </div>
        )}

        <div className="form-group-enad">
          <label className="form-label-enad">Select Solar Panel</label>
          <select
            className="assessment-form-select-enad"
            value={selectedPanelForCalc?._id || ''}
            onChange={(e) => {
              const panel = availablePanels.find(p => p._id === e.target.value);
              setSelectedPanelForCalc(panel);
            }}
          >
            <option value="">-- Select Panel --</option>
            {availablePanels.filter(p => p.isActive).map(panel => {
              const wattage = getPanelWattage(panel);
              return (
                <option key={panel._id} value={panel._id}>
                  {panel.name} - {wattage}W
                </option>
              );
            })}
          </select>
        </div>

        {selectedPanelForCalc && (
          <div className="selected-equipment-info">
            <div className="equipment-detail">
              <span>Panel Power: <strong>{panelWattage}W</strong></span>
              {selectedBatteryForCalc && (systemType === 'hybrid' || systemType === 'off-grid') && (
                <span>Battery DOD: <strong>{safeToFixed(dod * 100, 0)}%</strong></span>
              )}
            </div>
          </div>
        )}

        <div className="formula-display">
          <label className="form-label-enad"><strong>Formula:</strong> Day Consumption × Safety Factor / PSH</label>
          <label className="form-label-enad">Safety Factor: 1.3 (default)</label>
        </div>

        <button
          className="btn-calculate"
          onClick={calculateByElectricity}
          disabled={!isDataLoaded || totalDailyConsumption === 0 || !selectedPanelForCalc}
        >
          Calculate System Size
        </button>

        {!isDataLoaded && (
          <small className="form-hint-enad error-hint">No consumption data available. Please check client data.</small>
        )}
        {isDataLoaded && totalDailyConsumption === 0 && (
          <small className="form-hint-enad error-hint">Consumption data not provided by client.</small>
        )}
      </div>
    </div>
  );
};

// Net Metering Calculation Card - Read-only Target Savings
export const NetMeteringCalculationCard = ({
  dayConsumption,
  nightConsumption,
  dayPvCapacity,
  nightPvCapacity,
  totalPvCapacity,
  selectedPanelForCalc, setSelectedPanelForCalc,
  availablePanels,
  calculateByNetMetering,
  isDataLoaded,
  targetSavings        // Read-only - comes from database
}) => {
  const panelWattage = getPanelWattage(selectedPanelForCalc);

  return (
    <div className="calculation-card">
      <div className="calculation-card-header">
        <h4>Based on Net Metering</h4>
        <span className="calculation-badge">Grid-Tie Only</span>
      </div>
      <div className="calculation-card-body">
        <div className="consumption-display">
          <div className="consumption-item">
            <label>Day Consumption</label>
            <strong>{safeToFixed(dayConsumption)} kWh</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item">
            <label>Day PV Capacity</label>
            <strong>{safeToFixed(dayPvCapacity, 2)} kWp</strong>
            <small>Formula: Day × 1.3 / 3.5</small>
          </div>
          <div className="consumption-item">
            <label>Night Consumption</label>
            <strong>{safeToFixed(nightConsumption)} kWh</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item">
            <label>Night PV Capacity</label>
            <strong>{safeToFixed(nightPvCapacity, 2)} kWp</strong>
            <small>Formula: Night × 1.3 / 3.5</small>
          </div>
          <div className="consumption-item highlight">
            <label>Total PV Capacity</label>
            <strong>{safeToFixed(totalPvCapacity, 2)} kWp</strong>
            <small>Day PV + Night PV</small>
          </div>
        </div>

        {/* Target Savings - Read-only (from database) */}
        <div className="calculation-params">
          <div className="param-group">
            <label>Target Savings (%)</label>
            <div className="param-display read-only">{targetSavings}%</div>
            <small className="form-hint-enad">From client's energy profile</small>
          </div>
        </div>

        <div className="form-group-enad">
          <label className="form-label-enad">Select Solar Panel</label>
          <select
            className="assessment-form-select-enad"
            value={selectedPanelForCalc?._id || ''}
            onChange={(e) => {
              const panel = availablePanels.find(p => p._id === e.target.value);
              setSelectedPanelForCalc(panel);
            }}
          >
            <option value="">-- Select Panel --</option>
            {availablePanels.filter(p => p.isActive).map(panel => {
              const wattage = getPanelWattage(panel);
              return (
                <option key={panel._id} value={panel._id}>
                  {panel.name} - {wattage}W
                </option>
              );
            })}
          </select>
        </div>

        {selectedPanelForCalc && (
          <div className="selected-equipment-info">
            <div className="equipment-detail">
              <span>Panel Power: <strong>{panelWattage}W</strong></span>
            </div>
          </div>
        )}

        <div className="formula-display">
          <label className="form-label-enad"><strong>Formula:</strong> (Day PV Capacity + Night PV Capacity) × Target Savings</label>
          <label className="form-label-enad">PV Capacity = Consumption × 1.3 / 3.5 PSH</label>
        </div>

        

        <button
          className="btn-calculate"
          onClick={calculateByNetMetering}
          disabled={!isDataLoaded || (dayConsumption === 0 && nightConsumption === 0) || !selectedPanelForCalc}
        >
          Calculate System Size
        </button>

        {!isDataLoaded && (
          <small className="form-hint-enad error-hint">No consumption data available. Please check client data.</small>
        )}
        {isDataLoaded && dayConsumption === 0 && nightConsumption === 0 && (
          <small className="form-hint-enad error-hint">Consumption data not provided by client.</small>
        )}
      </div>
    </div>
  );
};

// Results Card - Battery only shown for Hybrid and Off-Grid (NOT Grid-Tie)
export const CalculationResultsCard = ({
  calculationResults,
  selectedCalculationMethod,
  applyCalculationResults,
  resetCalculationCards,
  systemType
}) => {
  // Only show battery results for Hybrid and Off-Grid
  const showBattery = systemType === 'hybrid' || systemType === 'off-grid';

  return (
    <div className="calculation-results-card">
      <div className="results-header">
        <h4>Calculation Results</h4>
        <span className="results-method">
          {selectedCalculationMethod === 'area' && 'Based on Area'}
          {selectedCalculationMethod === 'electricity' && 'Based on Electricity'}
          {selectedCalculationMethod === 'netmetering' && 'Based on Net Metering'}
        </span>
      </div>
      <div className="results-grid">
        <div className="result-item highlight">
          <label>System Size</label>
          <strong>{safeToFixed(calculationResults.recommendedSystemSize)} kWp</strong>
        </div>
        <div className="result-item">
          <label>Inverter Size</label>
          <strong>{safeToFixed(calculationResults.inverterSize)} kW</strong>
        </div>
        <div className="result-item">
          <label>Panels Needed</label>
          <strong>{calculationResults.panelsNeeded || 0} pcs</strong>
        </div>

        {/* Battery Capacity - Only for Hybrid and Off-Grid (NOT Grid-Tie) */}
        {showBattery && (calculationResults.batteryCapacity1Day > 0 || calculationResults.batteryCapacity2Day > 0 || calculationResults.batteryCapacity3Day > 0) && (
          <div className="result-item battery-autonomy">
            <label>Battery Capacity</label>
            <div className="battery-options">
              <div className="battery-option">
                <span>1 Day</span>
                <strong>{safeToFixed(calculationResults.batteryCapacity1Day)} kWh</strong>
              </div>
              <div className="battery-option">
                <span>2 Days</span>
                <strong>{safeToFixed(calculationResults.batteryCapacity2Day)} kWh</strong>
              </div>
              <div className="battery-option">
                <span>3 Days</span>
                <strong>{safeToFixed(calculationResults.batteryCapacity3Day)} kWh</strong>
              </div>
            </div>
            <small>DOD: {safeToFixed(calculationResults.depthOfDischarge * 100, 0)}%</small>
            <small className="formula-hint">Formula: Total Daily Consumption × Autonomy Days / DOD</small>
          </div>
        )}

        {/* Grid-Tie Note in Results */}
        {systemType === 'grid-tie' && (
          <div className="result-item system-info">
            <label>System Type</label>
            <strong>Grid-Tie (On-Grid)</strong>
            <small>No battery storage required</small>
          </div>
        )}

        <div className="result-item">
          <label>Panel Details</label>
          <strong>{calculationResults.panelWattage || 0}W</strong>
          <small>Panel Area: {safeToFixed(calculationResults.panelArea)}m²</small>
        </div>
        <div className="result-item">
          <label>Annual Production</label>
          <strong>{safeToFixed(calculationResults.estimatedAnnualProduction || 0)} kWh/yr</strong>
          {calculationResults.estimatedAnnualProductionMin > 0 && (
            <small>Range: {safeToFixed(calculationResults.estimatedAnnualProductionMin)} - {safeToFixed(calculationResults.estimatedAnnualProductionMax)} kWh/yr</small>
          )}
        </div>
        <div className="result-item">
          <label>CO₂ Offset</label>
          <strong>{safeToFixed(calculationResults.co2Offset || 0)} kg/yr</strong>
          {calculationResults.co2OffsetMin > 0 && (
            <small>Range: {safeToFixed(calculationResults.co2OffsetMin)} - {safeToFixed(calculationResults.co2OffsetMax)} kg/yr</small>
          )}
        </div>
      </div>
      <div className="results-actions">
        <button className="btn-use-results" onClick={applyCalculationResults}>
          Use This Configuration
        </button>
        <button className="btn-recalculate" onClick={resetCalculationCards}>
          Recalculate
        </button>
      </div>
    </div>
  );
};

// Export helper functions
export const equipmentHelpers = {
  getPanelWattage,
  getPanelArea,
  getDepthOfDischarge
};