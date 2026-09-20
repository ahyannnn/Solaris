// components/Engineer/SystemCalculationCards.jsx
import React, { useEffect, useRef } from 'react';
import { useToast, ToastNotification } from '../../assets/toastnotification';

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

// Reusable wrapper that gives every "Final Formula" a proper
// mathematical typeset block (native MathML, no extra dependency).
// Full variable names are used intentionally - do not shorten them.
const FormulaShell = ({ title = 'Formula', children }) => (
  <div className="formula-display math-block">
    <span className="formula-title">{title}</span>
    <div className="math-scroll">
      {children}
    </div>
  </div>
);

// Shows the live card data substituted into the formula (worked solution).
// Renders `children` (the substitution math) when `ready`, else a hint.
const Substitution = ({ ready, hint, children }) => (
  <div className="math-substitution">
    <span className="math-substitution-label">With data:</span>
    {ready ? children : <div className="math-hint">{hint}</div>}
  </div>
);

// Area Calculation Card - Auto-populated from database
export const AreaCalculationCard = ({
  roofLength,
  roofWidth,
  roofArea,
  selectedPanelForCalc, setSelectedPanelForCalc,
  availablePanels,
  calculateByArea,
  targetSavings,
  isDataLoaded,
  showToast
}) => {

  const panelWattage = getPanelWattage(selectedPanelForCalc);
  const panelArea = getPanelArea(selectedPanelForCalc);

  // Raw input values substituted into the formula below (no pre-computation)
  const targetNum = parseFloat(targetSavings) || 0;
  const areaReady = isDataLoaded && roofArea > 0 && !!selectedPanelForCalc && panelArea > 0;

  const handleCalculate = () => {
    if (!isDataLoaded || roofArea === 0 || !selectedPanelForCalc) {
      if (!selectedPanelForCalc) {
        showToast('Please select a solar panel first', 'warning');
      } else if (!isDataLoaded) {
        showToast('No roof dimension data available. Please check client data.', 'error');
      } else if (roofArea === 0) {
        showToast('Roof dimensions not provided by client.', 'error');
      }
      return;
    }
    calculateByArea();

    setTimeout(() => {
      showToast('Area calculation completed!', 'success', 3000);
    }, 300);
  };

  return (
    <div className="calculation-card">
      <div className="calculation-card-header">
        <h4>Based on Area</h4>
        <span className="calculation-badge">Grid-Tie • Off-Grid • Hybrid</span>
      </div>
      <div className="calculation-card-body">
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
          <div className="consumption-item ">
            <label>Total Roof Area</label>
            <strong>{safeToFixed(roofArea)} m²</strong>
            <small>Length × Width</small>
          </div>
          <div className="consumption-item ">
            <label>Target Savings</label>
            <strong>{safeToFixed(targetSavings)}%</strong>
            <small>From client's energy profile</small>
          </div>
          {roofArea > 0 && (
            <div className="consumption-item highlight">
              <label>Usable Area (70%)</label>
              <strong>{safeToFixed(roofArea * 0.7)} m²</strong>
              <small>70% of total roof area</small>
            </div>
          )}
        </div>



        <FormulaShell>
          <math display="block" className="math-formula" aria-label="PV Capacity in watts equals Area of roof times 70 percent times PV power divided by Area of PV module">
            <mrow>
              <mtext>PV Capacity (W)</mtext>
              <mo>=</mo>
              <mfrac>
                <mrow>
                  <mtext>Area of roof</mtext>
                  <mo>×</mo>
                  <mtext>70%</mtext>
                  <mo>×</mo>
                  <mtext>PV power (W)</mtext>
                </mrow>
                <mrow>
                  <mtext>Area of PV module</mtext>
                </mrow>
              </mfrac>
            </mrow>
          </math>
          <math display="block" className="math-formula" aria-label="System Size equals PV Capacity divided by 1000 times Target Savings">
            <mrow>
              <mtext>System Size (kWp)</mtext>
              <mo>=</mo>
              <mfrac>
                <mrow>
                  <mtext>PV Capacity (W)</mtext>
                </mrow>
                <mrow>
                  <mn>1000</mn>
                </mrow>
              </mfrac>
              <mo>×</mo>
              <mtext>Target Savings</mtext>
            </mrow>
          </math>
          <Substitution ready={areaReady} hint="Select a solar panel to see your values substituted into the formula.">
            <math display="block" className="math-formula" aria-label="PV Capacity with your data substituted">
              <mrow>
                <mtext>PV Capacity (W)</mtext>
                <mo>=</mo>
                <mfrac>
                  <mrow>
                    <mn>{safeToFixed(roofArea)}</mn>
                    <mo>×</mo>
                    <mtext>70%</mtext>
                    <mo>×</mo>
                    <mn>{panelWattage}</mn>
                  </mrow>
                  <mrow>
                    <mn>{safeToFixed(panelArea)}</mn>
                  </mrow>
                </mfrac>
              </mrow>
            </math>
            <math display="block" className="math-formula" aria-label="System Size with your data substituted">
              <mrow>
                <mtext>System Size (kWp)</mtext>
                <mo>=</mo>
                <mfrac>
                  <mrow>
                    <mtext>PV Capacity (W)</mtext>
                  </mrow>
                  <mrow>
                    <mn>1000</mn>
                  </mrow>
                </mfrac>
                <mo>×</mo>
                <mn>{safeToFixed(targetNum)}</mn>
                <mtext>%</mtext>
              </mrow>
            </math>
          </Substitution>
        </FormulaShell>

        <button
          className="btn-calculate"
          onClick={handleCalculate}
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
  targetSavings,
  selectedPanelForCalc, setSelectedPanelForCalc,
  availablePanels,
  calculateByElectricity,
  isDataLoaded,
  selectedBatteryForCalc,
  batteryAutonomy,
  setBatteryAutonomy,
  systemType,
  showToast
}) => {
  const panelWattage = getPanelWattage(selectedPanelForCalc);
  const dod = getDepthOfDischarge(selectedBatteryForCalc);

  const showBatteryAutonomy = systemType === 'hybrid';

  // Raw input values substituted into the formula below (no pre-computation)
  const billNum = parseFloat(monthlyBill) || 0;
  const rateNum = parseFloat(ratePerKwh) || 0;
  const pshNum = parseFloat(pshValue) || 3.5;
  const targetNum = parseFloat(targetSavings) || 0;
  const elecReady = isDataLoaded && billNum > 0 && rateNum > 0 && pshNum > 0;

  const handleCalculate = () => {
    if (!isDataLoaded || totalDailyConsumption === 0 || !selectedPanelForCalc) {
      if (!selectedPanelForCalc) {
        showToast('Please select a solar panel first', 'warning');
      } else if (!isDataLoaded) {
        showToast('No consumption data available. Please check client data.', 'error');
      } else if (totalDailyConsumption === 0) {
        showToast('Consumption data not provided by client.', 'error');
      }
      return;
    }
    calculateByElectricity();
  };

  return (
    <div className="calculation-card">
      <div className="calculation-card-header">
        <h4>Based on Electricity Bill</h4>
        <span className="calculation-badge">Grid-Tie • Hybrid • Off-Grid</span>
      </div>
      <div className="calculation-card-body">
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

        </div>
        <div className="consumption-display">
          <div className="consumption-item ">
            <label>Monthly Bill</label>
            <strong>₱{safeToFixed(monthlyBill, 2)}</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item">
            <label>Rate per kWh</label>
            <strong>₱{safeToFixed(ratePerKwh, 2)}</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item">
            <label>Target Savings</label>
            <strong>{safeToFixed(targetSavings)}%</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item highlight">
            <label>Total Daily Consumption (Electricity Bill)</label>
            <strong>{safeToFixed(monthlyBill / (ratePerKwh * 30))} kWh/day</strong>
            <small>From client data</small>
          </div>
        </div>





        <FormulaShell>
          <math display="block" className="math-formula" aria-label="System Size equals Total Daily Consumption Electric Bill times 1.3 divided by PSH, times Target Savings">
            <mrow>
              <mtext>System Size (kWp)</mtext>
              <mo>=</mo>
              <mfrac>
                <mrow>
                  <mtext>Total Daily Consumption (Electric Bill)</mtext>
                  <mo>×</mo>
                  <mn>1.3</mn>
                </mrow>
                <mrow>
                  <mtext>PSH</mtext>
                </mrow>
              </mfrac>
              <mo>×</mo>
              <mtext>Target Savings</mtext>
            </mrow>
          </math>
          <Substitution ready={elecReady} hint="No consumption data yet — values will appear here once client data is loaded.">
            <math display="block" className="math-formula" aria-label="Total Daily Consumption with your data substituted">
              
            </math>
            <math display="block" className="math-formula" aria-label="System Size with your data substituted">
              <mrow>
                <mtext>System Size (kWp)</mtext>
                <mo>=</mo>
                <mfrac>
                  <mrow>
                    <mtext>{safeToFixed(totalDailyConsumption)}</mtext>
                    <mo>×</mo>
                    <mn>1.3</mn>
                  </mrow>
                  <mrow>
                    <mn>{pshNum}</mn>
                  </mrow>
                </mfrac>
                <mo>×</mo>
                <mn>{safeToFixed(targetNum)}</mn>
                <mtext>%</mtext>
              </mrow>
            </math>
          </Substitution>
        </FormulaShell>

        <button
          className="btn-calculate"
          onClick={handleCalculate}
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

// Load Profile Calculation Card
export const LoadProfileCalculationCard = ({
  totalDailyConsumption,
  dayConsumption,
  nightConsumption,
  pshValue,
  setPshValue,
  targetSavings,
  selectedPanelForCalc,
  setSelectedPanelForCalc,
  availablePanels,
  calculateByLoadProfile,
  isDataLoaded,
  selectedBatteryForCalc,
  batteryAutonomy,
  setBatteryAutonomy,
  systemType,
  showToast
}) => {
  const panelWattage = getPanelWattage(selectedPanelForCalc);
  const dod = getDepthOfDischarge(selectedBatteryForCalc);

  const showBatteryAutonomy = systemType === 'hybrid' || systemType === 'off-grid';

  // Raw input values substituted into the formula below (no pre-computation)
  const dayNum = parseFloat(dayConsumption) || 0;
  const nightNum = parseFloat(nightConsumption) || 0;
  const pshNum = parseFloat(pshValue) || 3.5;
  const targetNum = parseFloat(targetSavings) || 0;
  const loadReady = isDataLoaded && (dayNum + nightNum) > 0 && pshNum > 0;

  const handleCalculate = () => {
    if (!isDataLoaded || totalDailyConsumption === 0 || !selectedPanelForCalc) {
      if (!selectedPanelForCalc) {
        showToast('Please select a solar panel first', 'warning');
      } else if (!isDataLoaded) {
        showToast('No consumption data available. Please check client data.', 'error');
      } else if (totalDailyConsumption === 0) {
        showToast('Consumption data not provided by client.', 'error');
      }
      return;
    }
    calculateByLoadProfile();

    setTimeout(() => {
      showToast('Load Profile calculation completed!', 'success', 3000);
    }, 300);
  };

  return (
    <div className="calculation-card">
      <div className="calculation-card-header">
        <h4>Based on Load Profile</h4>
        <span className="calculation-badge">Grid-Tie • Hybrid • Off-Grid</span>
      </div>
      <div className="calculation-card-body">


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
              {selectedBatteryForCalc && showBatteryAutonomy && (
                <span>Battery DOD: <strong>{safeToFixed(dod * 100, 0)}%</strong></span>
              )}
            </div>
          </div>
        )}
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

        </div>
        <div className="consumption-display">
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
            <label>Target Savings</label>
            <strong>{safeToFixed(targetSavings)}%</strong>
            <small>From client's energy profile</small>
          </div>
          <div className="consumption-item highlight">
            <label>Total Daily Consumption</label>
            <strong>{safeToFixed(totalDailyConsumption)} kWh</strong>
            <small>Day + Night consumption</small>
          </div>
        </div>



        <FormulaShell>
          <math display="block" className="math-formula" aria-label="System Size equals Total Daily Consumption Load Profile times 1.3 divided by PSH, times Target Savings">
            <mrow>
              <mtext>System Size (kWp)</mtext>
              <mo>=</mo>
              <mfrac>
                <mrow>
                  <mtext>Total Daily Consumption (Load Profile)</mtext>
                  <mo>×</mo>
                  <mn>1.3</mn>
                </mrow>
                <mrow>
                  <mtext>PSH</mtext>
                </mrow>
              </mfrac>
              <mo>×</mo>
              <mtext>Target Savings</mtext>
            </mrow>
          </math>
          <Substitution ready={loadReady} hint="No consumption data yet — values will appear here once client data is loaded.">
            
            <math display="block" className="math-formula" aria-label="System Size with your data substituted">
              <mrow>
                <mtext>System Size (kWp)</mtext>
                <mo>=</mo>
                <mfrac>
                  <mrow>
                    <mtext>{safeToFixed(totalDailyConsumption)}</mtext>
                    <mo>×</mo>
                    <mn>1.3</mn>
                  </mrow>
                  <mrow>
                    <mn>{pshNum}</mn>
                  </mrow>
                </mfrac>
                <mo>×</mo>
                <mn>{safeToFixed(targetNum)}</mn>
                <mtext>%</mtext>
              </mrow>
            </math>
          </Substitution>
        </FormulaShell>

        <button
          className="btn-calculate"
          onClick={handleCalculate}
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

// components/Engineer/SystemCalculationCards.jsx

// Net Metering Calculation Card - Read-only Target Savings
export const NetMeteringCalculationCard = ({
  dayConsumption,
  nightConsumption,
  dayPvCapacity,
  nightPvCapacity,
  totalPvCapacity,
  selectedPanelForCalc, 
  setSelectedPanelForCalc,
  availablePanels,
  calculateByNetMetering,
  isDataLoaded,
  targetSavings,
  exportRate,
  setExportRate,
  pshValue, // Add pshValue prop
  showToast
}) => {
  const panelWattage = getPanelWattage(selectedPanelForCalc);
  // Use pshValue if available, otherwise default to 3.5
  
  const psh = parseFloat(pshValue) || 3.5;

  // Use exportRate instead of ratePerKwh for net metering calculation
  const dayNetMeteringConsumption = (dayConsumption * 1.3 )/ psh;
  const nightNetMeteringConsumption = nightConsumption * 12 / exportRate;
  const nightNetMeteringPvCapacity = nightNetMeteringConsumption * 1.3 / psh;

  // Raw input values substituted into the formula below (no pre-computation)
  const dayNum = parseFloat(dayConsumption) || 0;
  const nightNum = parseFloat(nightConsumption) || 0;
  const expNum = parseFloat(exportRate) || 0;
  const targetNum = parseFloat(targetSavings) || 0;
  const netReady = isDataLoaded && (dayNum > 0 || nightNum > 0) && expNum > 0 && psh > 0;

  const handleCalculate = () => {
    if (!isDataLoaded || (dayConsumption === 0 && nightConsumption === 0) || !selectedPanelForCalc) {
      if (!selectedPanelForCalc) {
        showToast('Please select a solar panel first', 'warning');
      } else if (!isDataLoaded) {
        showToast('No consumption data available. Please check client data.', 'error');
      } else if (dayConsumption === 0 && nightConsumption === 0) {
        showToast('Consumption data not provided by client.', 'error');
      }
      return;
    }
    calculateByNetMetering();
  };

  return (
    <div className="calculation-card">
      <div className="calculation-card-header">
        <h4>Based on Net Metering</h4>
        <span className="calculation-badge">Grid-Tie</span>
      </div>
      <div className="calculation-card-body">
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

        {/* Export Rate Input */}
        <div className="calculation-params">
          <div className="param-group">
            <label>Export Rate (₱/kWh)</label>
            <input
              type="number"
              step="0.01"
              value={exportRate}
              onChange={(e) => setExportRate(parseFloat(e.target.value) || '')}
              className="param-input"
            />
            <small className="form-hint-enad">Used for net metering calculation</small>
          </div>
        </div>

        <div className="consumption-display">
          <div className="consumption-item">
            <label>Day Consumption</label>
            <strong>{safeToFixed(dayConsumption)} kWh</strong>
            <small>From client data</small>
          </div>
          <div className="consumption-item">
            <label>Day PV Capacity</label>
            <strong>{safeToFixed(dayNetMeteringConsumption, 2)} kWp</strong>
            <small>Day × 1.3 / {psh}</small>
          </div>
          <div className="consumption-item">
            <label>Night Consumption</label>
            <strong>{safeToFixed(nightNetMeteringConsumption)} kWh</strong>
            <small>Night × 12 / Export Rate</small>
          </div>
          <div className="consumption-item">
            <label>Night PV Capacity</label>
            <strong>{safeToFixed(nightNetMeteringPvCapacity, 2)} kWp</strong>
            <small>Night × 1.3 / {psh}</small>
          </div>
          <div className="consumption-item">
            <label>Target Savings</label>
            <strong>{safeToFixed(targetSavings)}%</strong>
            <small>From client's energy profile</small>
          </div>
          
        </div>

        <FormulaShell>
          <math display="block" className="math-formula" aria-label="System Size equals Day PV Capacity plus Night PV Capacity times Target Savings">
            <mrow>
              <mtext>System Size (kWp)</mtext>
              <mo>=</mo>
              <mrow>
                <mo>(</mo>
                <mtext>Day PV Capacity</mtext>
                <mo>+</mo>
                <mtext>Night PV Capacity</mtext>
                <mo>)</mo>
              </mrow>
              <mo>×</mo>
              <mtext>Target Savings</mtext>
            </mrow>
          </math>
          <Substitution ready={netReady} hint="No consumption data yet — values will appear here once client data is loaded.">
            
            
            <math display="block" className="math-formula" aria-label="System Size with your data substituted">
              <mrow>
                <mtext>System Size (kWp)</mtext>
                <mo>=</mo>
                <mrow>
                  <mo>(</mo>
                  <mtext>{safeToFixed(dayNetMeteringConsumption, 2)}</mtext>
                  <mo>+</mo>
                  <mtext>{safeToFixed(nightNetMeteringPvCapacity, 2)}</mtext>
                  <mo>)</mo>
                </mrow>
                <mo>×</mo>
                <mn>{safeToFixed(targetNum)}</mn>
                <mtext>%</mtext>
              </mrow>
            </math>
          </Substitution>
        </FormulaShell>

        <button
          className="btn-calculate"
          onClick={handleCalculate}
          disabled={!isDataLoaded || (dayConsumption === 0 && nightConsumption === 0) || !selectedPanelForCalc || exportRate <= 0}
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
  systemType,
  showToast,
  motorWatts = 0,
  nonMotorWatts = 0
}) => {
  const showBattery = systemType === 'hybrid' || systemType === 'off-grid';
  const resultsRef = useRef(null);
  const hasApplianceWatts = (parseFloat(motorWatts) || 0) > 0 || (parseFloat(nonMotorWatts) || 0) > 0;

  // Scroll to the calculation result whenever new results are produced
  // (covers clicks on any card's "Calculate System Size" button).
  useEffect(() => {
    if (calculationResults.recommendedSystemSize > 0 && resultsRef.current) {
      const t = setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [calculationResults.recommendedSystemSize, selectedCalculationMethod]);

  const handleApplyResults = () => {
    if (calculationResults.recommendedSystemSize === 0) {
      showToast('No calculation results to apply. Please calculate first.', 'warning');
      return;
    }
    applyCalculationResults();
    showToast('Configuration applied successfully!', 'success');
  };

  const handleRecalculate = () => {
    resetCalculationCards();
    showToast('Calculation reset. You can try a different method.', 'info');
  };

  return (
    <div className="calculation-results-card" ref={resultsRef}>
      <div className="results-header">
        <h4>Calculation Results</h4>
        <span className="results-method">
          {selectedCalculationMethod === 'area' && 'Based on Area'}
          {selectedCalculationMethod === 'electricity' && 'Based on Electricity'}
          {selectedCalculationMethod === 'loadprofile' && 'Based on Load Profile'}
          {selectedCalculationMethod === 'netmetering' && 'Based on Net Metering'}
        </span>
      </div>
      <div className="results-grid">
        <div className="result-item highlight">
          <label>System Size</label>
          <strong>{safeToFixed(calculationResults.recommendedSystemSize)} kWp</strong>
        </div>
        <div className="result-item">
          <label>Inverter Size{systemType === 'grid-tie' && (calculationResults.inverterQuantity || 1) > 1 ? ' (Total)' : ''}</label>
          {systemType === 'grid-tie' ? (
            <>
              <strong>
                {safeToFixed(calculationResults.inverterSize)} kW
                {(calculationResults.inverterQuantity || 1) > 1 ? ` x ${calculationResults.inverterQuantity}` : ''}
              </strong>
              <small>Matched from system size {safeToFixed(calculationResults.recommendedSystemSize)} kWp</small>
              
              {calculationResults.inverterCombo && calculationResults.inverterCombo.length > 1 && (
                <small>Combo: {calculationResults.inverterCombo.join('kW + ')}kW</small>
              )}
              
              
            </>
          ) : (
            <>
              <strong>{safeToFixed(calculationResults.inverterSize)} kW</strong>
              {hasApplianceWatts
                ? <small>( ({motorWatts} x 3 )+ {nonMotorWatts} )1.3</small>
                : <small>( (Total Motor power x 3 )+ other non motor )1.3</small>}
              <small>Hybrid / Off-grid surge sizing</small>
            </>
          )}
        </div>
        <div className="result-item">
          <label>Panels Needed</label>
          <strong>{calculationResults.panelsNeeded || 0} pcs</strong>
          <small>({safeToFixed(calculationResults.recommendedSystemSize)} X 1000)/{calculationResults.panelWattage || 0}</small>
        </div>

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
        <button className="btn-use-results" onClick={handleApplyResults}>
          Use This Configuration
        </button>
        <button className="btn-recalculate" onClick={handleRecalculate}>
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