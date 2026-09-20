// hooks/useSystemCalculation.js
import { useState } from 'react';

// Grid-tie inverter catalog (kW) — tolerance matching against calculated system size.
// Includes 2kW/3kW minimum per product requirement + standard 5-18kW range.
// Rule: stay on the lower size when system is within TOLERANCE above it
// (e.g. 6.05 stays on 6kW, 6.8 jumps to 8kW). Slight undersize (DC/AC ~1.0-1.1) is normal.
export const GRID_TIE_INVERTER_SIZES = [2, 3, 5, 6, 8, 10, 12, 16, 18];
export const GRID_TIE_MAX_SINGLE_SIZE = 18;
export const GRID_TIE_TOLERANCE = 0.10;

// Parse an inverter equipment item to kW (handles capacity.value, power, or name like "Solis 8kW Grid-Tie").
export const getInverterSizeKw = (inv) => {
  if (!inv) return 0;
  const capVal = parseFloat(inv.capacity?.value);
  if (!isNaN(capVal) && capVal > 0) {
    const unit = String(inv.capacity?.unit || '').toLowerCase();
    if (unit === 'w' || unit === 'watt' || unit === 'watts') return capVal >= 100 ? capVal / 1000 : capVal;
    // No unit stored in most records — values >=100 are almost certainly watts.
    if (!unit && capVal >= 100) return capVal / 1000;
    if (capVal >= 100) return capVal / 1000;
    return capVal;
  }
  const p = parseFloat(inv.power);
  if (!isNaN(p) && p > 0) return p >= 100 ? p / 1000 : p;
  const m = String(inv.name || inv.model || '').match(/(\d+(\.\d+)?)\s*kW/i);
  if (m) return parseFloat(m[1]);
  return 0;
};

// Tolerance match: stay on the lower size when within GRID_TIE_TOLERANCE above it,
// else jump up. e.g. 6.05 -> 6kW (0.8% over), 6.8 -> 8kW (13% over).
// For systems above max single size, use balanced same-model multiples so the
// existing single-model + quantity equipment UI can represent it:
//   singleLimit = max * (1 + tol); n = ceil(system / singleLimit), perUnit = pick(system / n)
//   e.g. 6.05 -> [6]x1, 7.2 -> [8]x1, 18.5 -> [18]x1, 20 -> [10,10]x2, 37 -> [18,18]x2
export const pickToleranceSize = (value, sortedSizes, tolerance = GRID_TIE_TOLERANCE) => {
  const v = parseFloat(value) || 0;
  const sorted = [...sortedSizes].sort((a, b) => a - b);
  if (sorted.length === 0 || v <= 0) return 0;
  if (v <= sorted[0] + 1e-9) return sorted[0];
  if (v >= sorted[sorted.length - 1] - 1e-9) {
    const lower = sorted[sorted.length - 1];
    // Caller decides singles vs multiples; here just report the top size.
    return lower;
  }
  let lower = sorted[0];
  let upper = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] <= v + 1e-9) lower = sorted[i];
    if (sorted[i] >= v - 1e-9) { upper = sorted[i]; break; }
  }
  if (Math.abs(v - lower) < 1e-9) return lower;
  if (Math.abs(upper - lower) < 1e-9) return lower;
  return ((v - lower) / lower) <= tolerance + 1e-9 ? lower : upper;
};

export const matchGridTieInverter = (systemSizeKw, sizes = GRID_TIE_INVERTER_SIZES, tolerance = GRID_TIE_TOLERANCE) => {
  const sys = parseFloat(systemSizeKw) || 0;
  if (sys <= 0) return { size: 0, qty: 0, combo: [], dcAcRatio: 0 };
  const sorted = [...sizes].sort((a, b) => a - b);
  const max = sorted[sorted.length - 1];
  const singleLimit = max * (1 + tolerance);
  const finish = (size, qty, combo) => {
    const total = combo.reduce((a, b) => a + b, 0);
    return { size, qty, combo, dcAcRatio: total > 0 ? Math.round((sys / total) * 100) / 100 : 0 };
  };
  if (sys <= singleLimit + 1e-9) {
    const size = pickToleranceSize(Math.min(sys, max), sorted, tolerance);
    // sys slightly above max but within tolerance still maps to single max (e.g. 18.5 -> 18x1).
    return finish(sys <= max ? size : max, 1, [sys <= max ? size : max]);
  }
  const n = Math.ceil(sys / singleLimit);
  const perUnit = pickToleranceSize(sys / n, sorted, tolerance);
  return finish(perUnit, n, Array(n).fill(perUnit));
};

export const useSystemCalculation = () => {
  const [showCalculationCards, setShowCalculationCards] = useState(true);
  const [selectedCalculationMethod, setSelectedCalculationMethod] = useState(null);
  const [hasCalculated, setHasCalculated] = useState(false);
  const [showEquipmentSelection, setShowEquipmentSelection] = useState(false);

  // Area calculation inputs - auto-populated from database
  const [roofLength, setRoofLength] = useState(0);
  const [roofWidth, setRoofWidth] = useState(0);
  const [roofArea, setRoofArea] = useState(0);
  const [selectedPanelForCalc, setSelectedPanelForCalc] = useState(null);
  const [selectedBatteryForCalc, setSelectedBatteryForCalc] = useState(null);

  // Electricity calculation inputs (auto-filled from selectedItem data)
  const [totalDailyConsumption, setTotalDailyConsumption] = useState(0);
  const [dayConsumption, setDayConsumption] = useState(0);
  const [nightConsumption, setNightConsumption] = useState(0);
  const [ratePerKwh, setRatePerKwh] = useState(12);
  const [monthlyBill, setMonthlyBill] = useState(0);
  const [targetSavings, setTargetSavings] = useState(100);
  const [pshValue, setPshValue] = useState(3.5);

  // Battery autonomy (days) - 1 to 3 days
  const [batteryAutonomy, setBatteryAutonomy] = useState(1);

  // Motor and Non-Motor Appliances data
  const [motorAppliancesWatts, setMotorAppliancesWatts] = useState(0);
  const [nonMotorAppliancesWatts, setNonMotorAppliancesWatts] = useState(0);

  // Data loaded flag
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // Net metering auto-calculated values
  const [dayPvCapacity, setDayPvCapacity] = useState(0);
  const [nightPvCapacity, setNightPvCapacity] = useState(0);
  const [totalPvCapacity, setTotalPvCapacity] = useState(0);
  const [exportRate, setExportRate] = useState(6);

  const [calculationResults, setCalculationResults] = useState({
    recommendedSystemSize: 0,
    inverterSize: 0,
    inverterQuantity: 1,
    inverterCombo: [],
    systemTypeUsed: '',
    recommendedInverterLabel: '',
    dcAcRatio: 0,
    panelsNeeded: 0,
    batteryCapacityKwh: 0,
    batteryCapacity1Day: 0,
    batteryCapacity2Day: 0,
    batteryCapacity3Day: 0,
    estimatedAnnualProduction: 0,
    estimatedAnnualProductionMin: 0,
    estimatedAnnualProductionMax: 0,
    co2Offset: 0,
    co2OffsetMin: 0,
    co2OffsetMax: 0,
    panelWattage: 550,
    panelArea: 2.5,
    depthOfDischarge: 0.8
  });

  // Initialize from selected item data
  const initializeFromData = (selectedItem) => {
    if (!selectedItem) {
      setIsDataLoaded(false);
      return;
    }

    const length = parseFloat(selectedItem.roofLength) || 0;
    const width = parseFloat(selectedItem.roofWidth) || 0;
    const area = length * width;

    setRoofLength(length);
    setRoofWidth(width);
    setRoofArea(area);

    const day = parseFloat(selectedItem.dayConsumption) || 0;
    const night = parseFloat(selectedItem.nightConsumption) || 0;
    const total = day + night;
    const rate = parseFloat(selectedItem.rate) || 12;
    const bill = parseFloat(selectedItem.monthlyBill) || 0;

    // Get target savings from selected item or use default
    const target = parseFloat(selectedItem.targetSavings) || 100;
    setTargetSavings(target);

    setTotalDailyConsumption(total);
    setDayConsumption(day);
    setNightConsumption(night);
    setMonthlyBill(bill);
    setRatePerKwh(rate);

    const motor = parseFloat(selectedItem.motorAppliancesWatts) || 0;
    const nonMotor = parseFloat(selectedItem.nonMotorAppliancesWatts) || 0;

    setMotorAppliancesWatts(motor);
    setNonMotorAppliancesWatts(nonMotor);

    const safetyFactor = 1.3;
    const psh = 3.5;
    const dayPv = day > 0 ? (day * safetyFactor) / psh : 0;
    const nightPv = night > 0 ? (night * safetyFactor) / psh : 0;
    setDayPvCapacity(dayPv);
    setNightPvCapacity(nightPv);
    setTotalPvCapacity(dayPv + nightPv);

    const hasData = (area > 0) || (total > 0);
    setIsDataLoaded(hasData);

    
  };

  const setPshFromIoT = (peakSunHours) => {
    if (peakSunHours && peakSunHours > 0) {
      setPshValue(peakSunHours);
      
    }
  };

  const calculateRoofArea = () => {
    return roofArea;
  };

  const getPanelWattage = (panel) => {
    if (!panel) return 0.55;
    return panel.capacity?.value ? panel.capacity.value / 1000 : (panel.power || 0.55);
  };

  const getPanelWattageInWatts = (panel) => {
    if (!panel) return 550;
    return panel.capacity?.value || panel.power || 550;
  };

  const getPanelArea = (panel) => {
    if (!panel) return 2.5;
    return panel.panelArea || panel.area || 2.5;
  };

  const getDepthOfDischarge = (battery) => {
    if (!battery) return 0.8;
    return battery.dob || 0.8;
  };

  const calculateInverterSize = () => {
    const motor = parseFloat(motorAppliancesWatts) || 0;
    const nonMotor = parseFloat(nonMotorAppliancesWatts) || 0;
    const safetyFactor = 1.3;
    const inverterKva = ((motor * 3) + nonMotor) * safetyFactor / 1000;
    return Math.ceil(inverterKva * 100) / 100;
  };

  const calculateBatteryCapacity = (totalDailyConsumption, autonomyDays, depthOfDischarge) => {
    if (totalDailyConsumption <= 0) return 0;
    const capacity = (totalDailyConsumption * autonomyDays) / depthOfDischarge;
    return Math.round(capacity * 100) / 100;
  };

  // ===== CALCULATION 1: Based on Area × Target Savings =====
  const calculateByArea = (systemType) => {
    const area = roofArea;
    if (area === 0) {
      alert('No roof dimensions available. Please check client data.');
      return;
    }

    if (!selectedPanelForCalc) {
      alert('Please select a solar panel');
      return;
    }

    const target = parseFloat(targetSavings) || 100;
    const PANEL_WATTAGE_KW = getPanelWattage(selectedPanelForCalc);
    const PANEL_WATTAGE_W = getPanelWattageInWatts(selectedPanelForCalc);
    const panelArea = getPanelArea(selectedPanelForCalc);
    const DEPTH_OF_DISCHARGE = selectedBatteryForCalc
      ? getDepthOfDischarge(selectedBatteryForCalc)
      : 0.8;

    const usableArea = area * 0.7;
    // Formula: ((Usable Area / Panel Area) * Panel Wattage) * (Target Savings / 100)
    const baseSystemSize = (usableArea / panelArea) * PANEL_WATTAGE_KW;
    const recommendedSystemSize = Math.round((baseSystemSize * (target / 100)) * 100) / 100;

    const panelsNeeded = Math.ceil((recommendedSystemSize * 1000) / PANEL_WATTAGE_W);
    // Hybrid/off-grid keeps motor-surge formula; grid-tie matches system size to catalog (10% tolerance).
    const isGridTie = systemType === 'grid-tie';
    let inverterSize = Math.ceil(calculateInverterSize() * 100) / 100;
    let inverterQuantity = 1;
    let inverterCombo = [inverterSize];
    let recommendedInverterLabel = '';
    let dcAcRatio = 0;
    if (isGridTie) {
      const match = matchGridTieInverter(recommendedSystemSize);
      inverterSize = match.size;
      inverterQuantity = match.qty;
      inverterCombo = match.combo;
      dcAcRatio = match.dcAcRatio;
      recommendedInverterLabel = match.qty > 1
        ? `${match.qty} x ${match.size}kW (${match.combo.join(' + ')}kW)`
        : `${match.size}kW`;
    }

    const totalConsumption = totalDailyConsumption || (recommendedSystemSize * pshValue * 0.85);
    const batteryCapacity1Day = calculateBatteryCapacity(totalConsumption, 1, DEPTH_OF_DISCHARGE);
    const batteryCapacity2Day = calculateBatteryCapacity(totalConsumption, 2, DEPTH_OF_DISCHARGE);
    const batteryCapacity3Day = calculateBatteryCapacity(totalConsumption, 3, DEPTH_OF_DISCHARGE);
    const batteryCapacityKwh = batteryCapacity1Day;

    const MIN_PSH = 3, MAX_PSH = 4.5;
    const annualProduction = Math.round((recommendedSystemSize * pshValue * 365) / 1.3);
    const annualProductionMin = Math.round((recommendedSystemSize * MIN_PSH * 365) / 1.3);
    const annualProductionMax = Math.round((recommendedSystemSize * MAX_PSH * 365) / 1.3);

    setCalculationResults({
      recommendedSystemSize,
      inverterSize,
      inverterQuantity,
      inverterCombo,
      systemTypeUsed: systemType || '',
      recommendedInverterLabel,
      dcAcRatio,
      panelsNeeded,
      batteryCapacityKwh,
      batteryCapacity1Day,
      batteryCapacity2Day,
      batteryCapacity3Day,
      estimatedAnnualProduction: annualProduction,
      estimatedAnnualProductionMin: annualProductionMin,
      estimatedAnnualProductionMax: annualProductionMax,
      co2Offset: Math.round(annualProduction * 0.5),
      co2OffsetMin: Math.round(annualProductionMin * 0.5),
      co2OffsetMax: Math.round(annualProductionMax * 0.5),
      panelWattage: PANEL_WATTAGE_W,
      panelArea: panelArea,
      depthOfDischarge: DEPTH_OF_DISCHARGE
    });

    setSelectedCalculationMethod('area');
    setHasCalculated(true);
  };

  // ===== CALCULATION 2: Based on Electricity Bill × Target Savings =====
  const calculateByElectricity = (systemType) => {
    const monthlybill = parseFloat(monthlyBill) || 0;
    const rate = parseFloat(ratePerKwh) || 12;
    const total = monthlybill / (rate * 30);
    const target = parseFloat(targetSavings) || 100;

   

    if (total === 0) {
      alert('No consumption data available. Please check client data.');
      return;
    }

    if (!selectedPanelForCalc) {
      alert('Please select a solar panel');
      return;
    }

    const PANEL_WATTAGE_KW = getPanelWattage(selectedPanelForCalc);
    const PANEL_WATTAGE_W = getPanelWattageInWatts(selectedPanelForCalc);
    const DEPTH_OF_DISCHARGE = selectedBatteryForCalc
      ? getDepthOfDischarge(selectedBatteryForCalc)
      : 0.8;
    const safetyFactor = 1.3;
    
    // Formula: ((total daily consumption * safety factor) / psh) * target savings
    const baseSystemSize = (total * safetyFactor) / pshValue;
    const recommendedSystemSize = Math.round((baseSystemSize * (target / 100)) * 100) / 100;

    // Hybrid/off-grid keeps motor-surge formula; grid-tie matches system size to catalog (10% tolerance).
    const isGridTie = systemType === 'grid-tie';
    let inverterSize = Math.ceil(calculateInverterSize() * 100) / 100;
    let inverterQuantity = 1;
    let inverterCombo = [inverterSize];
    let recommendedInverterLabel = '';
    let dcAcRatio = 0;
    if (isGridTie) {
      const match = matchGridTieInverter(recommendedSystemSize);
      inverterSize = match.size;
      inverterQuantity = match.qty;
      inverterCombo = match.combo;
      dcAcRatio = match.dcAcRatio;
      recommendedInverterLabel = match.qty > 1
        ? `${match.qty} x ${match.size}kW (${match.combo.join(' + ')}kW)`
        : `${match.size}kW`;
    }
    const panelsNeeded = Math.ceil((recommendedSystemSize * 1000) / PANEL_WATTAGE_W);

    let batteryCapacity1Day = 0;
    let batteryCapacity2Day = 0;
    let batteryCapacity3Day = 0;
    let batteryCapacityKwh = 0;

    if (systemType === 'hybrid' || systemType === 'off-grid') {
      batteryCapacity1Day = calculateBatteryCapacity(total, 1, DEPTH_OF_DISCHARGE);
      batteryCapacity2Day = calculateBatteryCapacity(total, 2, DEPTH_OF_DISCHARGE);
      batteryCapacity3Day = calculateBatteryCapacity(total, 3, DEPTH_OF_DISCHARGE);
      batteryCapacityKwh = batteryCapacity1Day;
    }

    const MIN_PSH = 3, MAX_PSH = 4.5;
    const annualProduction = Math.round((recommendedSystemSize * pshValue * 365) / 1.3);
    const annualProductionMin = Math.round((recommendedSystemSize * MIN_PSH * 365) / 1.3);
    const annualProductionMax = Math.round((recommendedSystemSize * MAX_PSH * 365) / 1.3);

    setCalculationResults({
      recommendedSystemSize,
      inverterSize,
      inverterQuantity,
      inverterCombo,
      systemTypeUsed: systemType || '',
      recommendedInverterLabel,
      dcAcRatio,
      panelsNeeded,
      batteryCapacityKwh,
      batteryCapacity1Day,
      batteryCapacity2Day,
      batteryCapacity3Day,
      estimatedAnnualProduction: annualProduction,
      estimatedAnnualProductionMin: annualProductionMin,
      estimatedAnnualProductionMax: annualProductionMax,
      co2Offset: Math.round(annualProduction * 0.5),
      co2OffsetMin: Math.round(annualProductionMin * 0.5),
      co2OffsetMax: Math.round(annualProductionMax * 0.5),
      panelWattage: PANEL_WATTAGE_W,
      panelArea: getPanelArea(selectedPanelForCalc),
      depthOfDischarge: DEPTH_OF_DISCHARGE
    });

    setSelectedCalculationMethod('electricity');
    setHasCalculated(true);
  };

  // ===== CALCULATION 3: Based on Load Profile × Target Savings =====
  const calculateByLoadProfile = (systemType) => {
    const total = parseFloat(totalDailyConsumption) || 0;
    const target = parseFloat(targetSavings) || 100;
    
    

    if (total === 0) {
      alert('No consumption data available. Please check client data.');
      return;
    }

    if (!selectedPanelForCalc) {
      alert('Please select a solar panel');
      return;
    }

    const PANEL_WATTAGE_KW = getPanelWattage(selectedPanelForCalc);
    const PANEL_WATTAGE_W = getPanelWattageInWatts(selectedPanelForCalc);
    const DEPTH_OF_DISCHARGE = selectedBatteryForCalc
      ? getDepthOfDischarge(selectedBatteryForCalc)
      : 0.8;
    const safetyFactor = 1.3;
    
    // Formula: ((total daily consumption * safety factor) / psh) * target savings
    const baseSystemSize = (total * safetyFactor) / pshValue;
    const recommendedSystemSize = Math.round((baseSystemSize * (target / 100)) * 100) / 100;

    // Hybrid/off-grid keeps motor-surge formula; grid-tie matches system size to catalog (10% tolerance).
    const isGridTieLoad = systemType === 'grid-tie';
    let inverterSize = Math.ceil(calculateInverterSize() * 100) / 100;
    let inverterQuantity = 1;
    let inverterCombo = [inverterSize];
    let recommendedInverterLabel = '';
    let dcAcRatio = 0;
    if (isGridTieLoad) {
      const match = matchGridTieInverter(recommendedSystemSize);
      inverterSize = match.size;
      inverterQuantity = match.qty;
      inverterCombo = match.combo;
      dcAcRatio = match.dcAcRatio;
      recommendedInverterLabel = match.qty > 1
        ? `${match.qty} x ${match.size}kW (${match.combo.join(' + ')}kW)`
        : `${match.size}kW`;
    }
    const panelsNeeded = Math.ceil((recommendedSystemSize * 1000) / PANEL_WATTAGE_W);

    let batteryCapacity1Day = 0;
    let batteryCapacity2Day = 0;
    let batteryCapacity3Day = 0;
    let batteryCapacityKwh = 0;

    // Use original total consumption for battery sizing
    batteryCapacity1Day = calculateBatteryCapacity(total, 1, DEPTH_OF_DISCHARGE);
    batteryCapacity2Day = calculateBatteryCapacity(total, 2, DEPTH_OF_DISCHARGE);
    batteryCapacity3Day = calculateBatteryCapacity(total, 3, DEPTH_OF_DISCHARGE);
    batteryCapacityKwh = batteryCapacity1Day;

    const MIN_PSH = 3, MAX_PSH = 4.5;
    const annualProduction = Math.round((recommendedSystemSize * pshValue * 365) / 1.3);
    const annualProductionMin = Math.round((recommendedSystemSize * MIN_PSH * 365) / 1.3);
    const annualProductionMax = Math.round((recommendedSystemSize * MAX_PSH * 365) / 1.3);

    setCalculationResults({
      recommendedSystemSize,
      inverterSize,
      inverterQuantity,
      inverterCombo,
      systemTypeUsed: systemType || '',
      recommendedInverterLabel,
      dcAcRatio,
      panelsNeeded,
      batteryCapacityKwh,
      batteryCapacity1Day,
      batteryCapacity2Day,
      batteryCapacity3Day,
      estimatedAnnualProduction: annualProduction,
      estimatedAnnualProductionMin: annualProductionMin,
      estimatedAnnualProductionMax: annualProductionMax,
      co2Offset: Math.round(annualProduction * 0.5),
      co2OffsetMin: Math.round(annualProductionMin * 0.5),
      co2OffsetMax: Math.round(annualProductionMax * 0.5),
      panelWattage: PANEL_WATTAGE_W,
      panelArea: getPanelArea(selectedPanelForCalc),
      depthOfDischarge: DEPTH_OF_DISCHARGE
    });

    setSelectedCalculationMethod('loadprofile');
    setHasCalculated(true);
  };

  // hooks/useSystemCalculation.js

const calculateByNetMetering = (systemType) => {
  const day = parseFloat(dayConsumption) || 0;
  const night = parseFloat(nightConsumption) || 0;
  const target = parseFloat(targetSavings) || 100;
  const exportRateValue = parseFloat(exportRate) || 12;
  
  const psh = parseFloat(pshValue) || 3.5;
  
  

  if (day === 0 && night === 0) {
    alert('No consumption data available. Please check client data.');
    return;
  }

  if (!selectedPanelForCalc) {
    alert('Please select a solar panel');
    return;
  }

  const PANEL_WATTAGE_KW = getPanelWattage(selectedPanelForCalc);
  const PANEL_WATTAGE_W = getPanelWattageInWatts(selectedPanelForCalc);
  const DEPTH_OF_DISCHARGE = selectedBatteryForCalc
    ? getDepthOfDischarge(selectedBatteryForCalc)
    : 0.8;
  const safetyFactor = 1.3;

  // Formula: (day consumption * safety factor / psh) + (night consumption * 12 / exportRate * safety factor / psh) * target savings
  const dayPv = (day * safetyFactor) / psh;
  const nightPv = ((night * 12 / exportRateValue) * safetyFactor) / psh;
  const totalPv = dayPv + nightPv;
  const recommendedSystemSize = Math.round((totalPv * (target / 100)) * 100) / 100;

  // Net Metering card is grid-tie only: inverter is matched from system size (10% tolerance).
  // If called with hybrid/off-grid explicitly, fall back to surge formula for safety.
  const isGridTieNet = !systemType || systemType === 'grid-tie';
  let inverterSize = Math.ceil(calculateInverterSize() * 100) / 100;
  let inverterQuantity = 1;
  let inverterCombo = [inverterSize];
  let recommendedInverterLabel = '';
  let dcAcRatio = 0;
  if (isGridTieNet) {
    const match = matchGridTieInverter(recommendedSystemSize);
    inverterSize = match.size;
    inverterQuantity = match.qty;
    inverterCombo = match.combo;
    dcAcRatio = match.dcAcRatio;
    recommendedInverterLabel = match.qty > 1
      ? `${match.qty} x ${match.size}kW (${match.combo.join(' + ')}kW)`
      : `${match.size}kW`;
  }
  const panelsNeeded = Math.ceil((recommendedSystemSize * 1000) / PANEL_WATTAGE_W);
  const batteryCapacityKwh = 0;

  const MIN_PSH = 3, MAX_PSH = 4.5;
  const annualProduction = Math.round((recommendedSystemSize * psh * 365) / 1.3);
  const annualProductionMin = Math.round((recommendedSystemSize * MIN_PSH * 365) / 1.3);
  const annualProductionMax = Math.round((recommendedSystemSize * MAX_PSH * 365) / 1.3);

  setCalculationResults({
    recommendedSystemSize,
    inverterSize,
    inverterQuantity,
    inverterCombo,
    systemTypeUsed: systemType || 'grid-tie',
    recommendedInverterLabel,
    dcAcRatio,
    panelsNeeded,
    batteryCapacityKwh,
    batteryCapacity1Day: 0,
    batteryCapacity2Day: 0,
    batteryCapacity3Day: 0,
    estimatedAnnualProduction: annualProduction,
    estimatedAnnualProductionMin: annualProductionMin,
    estimatedAnnualProductionMax: annualProductionMax,
    co2Offset: Math.round(annualProduction * 0.5),
    co2OffsetMin: Math.round(annualProductionMin * 0.5),
    co2OffsetMax: Math.round(annualProductionMax * 0.5),
    panelWattage: PANEL_WATTAGE_W,
    panelArea: getPanelArea(selectedPanelForCalc),
    depthOfDischarge: DEPTH_OF_DISCHARGE
  });

  setSelectedCalculationMethod('netmetering');
  setHasCalculated(true);
};

  const applyCalculationResults = (
    setFreeQuoteForm,
    setFreeQuoteSelectedPanel,
    setFreeQuotePanelQuantity,
    setFreeQuoteSelectedInverter,
    setFreeQuoteInverterQuantity,
    setFreeQuoteSelectedBattery,
    setFreeQuoteBatteryQuantity,
    availablePanels,
    availableInverters,
    availableBatteries,
    showToast,
    systemType
  ) => {
    if (calculationResults.recommendedSystemSize === 0) {
      showToast('Please calculate the system size first', 'warning');
      return;
    }

    setFreeQuoteForm(prev => ({ ...prev, systemSize: calculationResults.recommendedSystemSize }));

    if (availablePanels.length > 0 && calculationResults.panelsNeeded > 0) {
      const targetWattage = calculationResults.panelWattage;
      const bestPanel = availablePanels.find(p => {
        const panelWattage = p.capacity?.value || p.power || 550;
        return Math.abs(panelWattage - targetWattage) < 50;
      }) || availablePanels[0];
      setFreeQuoteSelectedPanel(bestPanel);
      setFreeQuotePanelQuantity(calculationResults.panelsNeeded);
    }

    // Grid-tie: tolerance match to grid-tie catalog, quantity from multiples.
    // Hybrid/off-grid: keep legacy ±1kW tolerance match, qty 1.
    const effectiveSystemType = systemType || calculationResults.systemTypeUsed || '';
    const isGridTieApply = effectiveSystemType === 'grid-tie';
    if (availableInverters.length > 0 && calculationResults.inverterSize > 0) {
      if (isGridTieApply) {
        const targetSize = calculationResults.inverterSize;
        const targetQty = calculationResults.inverterQuantity || 1;
        const active = availableInverters.filter((i) => i.isActive !== false);
        const pool = active.length > 0 ? active : availableInverters;
        const gridPool = pool.filter((i) =>
          /grid[\s-]*tie|on[\s-]*grid/i.test(`${i.name || ''} ${i.model || ''} ${i.brand || ''}`)
        );
        const searchPool = gridPool.length > 0 ? gridPool : pool;
        const withSizes = searchPool
          .map((inv) => ({ inv, size: getInverterSizeKw(inv) }))
          .filter((x) => x.size > 0)
          .sort((a, b) => a.size - b.size);
        let bestInverter = null;
        if (withSizes.length > 0) {
          // Same 10% tolerance rule applied to actual stock sizes:
          // stay on lower stock size when target is within tolerance above it.
          const stockSizes = withSizes.map((x) => x.size);
          const picked = pickToleranceSize(targetSize, stockSizes, GRID_TIE_TOLERANCE);
          bestInverter = (withSizes.find((x) => Math.abs(x.size - picked) < 1e-9)
            || withSizes.find((x) => x.size >= targetSize - 1e-9)
            || withSizes[withSizes.length - 1]).inv;
        } else {
          bestInverter = searchPool[0];
        }
        setFreeQuoteSelectedInverter(bestInverter);
        setFreeQuoteInverterQuantity(targetQty);
        const matchedSize = bestInverter ? getInverterSizeKw(bestInverter) : 0;
        if (matchedSize > 0 && matchedSize + 1e-9 < targetSize) {
          showToast(`Note: closest stock inverter (${matchedSize}kW) is below recommended ${targetSize}kW`, 'warning');
        }
      } else {
        const targetSize = calculationResults.inverterSize;
        const bestInverter = availableInverters.find(i => {
          const invSize = getInverterSizeKw(i) || 5;
          return Math.abs(invSize - targetSize) < 1;
        }) || availableInverters[0];
        setFreeQuoteSelectedInverter(bestInverter);
        setFreeQuoteInverterQuantity(1);
      }
    }

    if (calculationResults.batteryCapacityKwh > 0 && availableBatteries.length > 0) {
      const targetCapacity = calculationResults.batteryCapacityKwh;
      const bestBattery = availableBatteries.find(b => {
        const battCapacity = b.capacity?.value || b.capacity || 5;
        return Math.abs(battCapacity - targetCapacity) < 2;
      }) || availableBatteries[0];
      setFreeQuoteSelectedBattery(bestBattery);
      setFreeQuoteBatteryQuantity(1);
    }

    setShowCalculationCards(false);
    setShowEquipmentSelection(true);
    showToast(`System size set to ${calculationResults.recommendedSystemSize} kWp`, 'success');
    // Jump to page top so the engineer starts at the top of the equipment
    // section instead of landing mid-content. Deferred so it runs after render.
    if (typeof window !== 'undefined') {
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 150);
    }
  };

  const resetCalculationCards = () => {
    setShowCalculationCards(true);
    setShowEquipmentSelection(false);
    setSelectedCalculationMethod(null);
    setHasCalculated(false);
    setSelectedPanelForCalc(null);
    setSelectedBatteryForCalc(null);
    setCalculationResults({
      recommendedSystemSize: 0,
      inverterSize: 0,
      inverterQuantity: 1,
      inverterCombo: [],
      systemTypeUsed: '',
      recommendedInverterLabel: '',
      panelsNeeded: 0,
      batteryCapacityKwh: 0,
      batteryCapacity1Day: 0,
      batteryCapacity2Day: 0,
      batteryCapacity3Day: 0,
      estimatedAnnualProduction: 0,
      estimatedAnnualProductionMin: 0,
      estimatedAnnualProductionMax: 0,
      co2Offset: 0,
      co2OffsetMin: 0,
      co2OffsetMax: 0,
      panelWattage: 550,
      panelArea: 2.5,
      depthOfDischarge: 0.8
    });
  };

  return {
    showCalculationCards, setShowCalculationCards,
    showEquipmentSelection, setShowEquipmentSelection,
    selectedCalculationMethod, setSelectedCalculationMethod,
    hasCalculated, setHasCalculated,
    exportRate, setExportRate,
    roofLength, setRoofLength,
    roofWidth, setRoofWidth,
    roofArea,
    selectedPanelForCalc, setSelectedPanelForCalc,
    selectedBatteryForCalc, setSelectedBatteryForCalc,
    totalDailyConsumption, setTotalDailyConsumption,
    dayConsumption, setDayConsumption,
    nightConsumption, setNightConsumption,
    ratePerKwh, setRatePerKwh,
    monthlyBill, setMonthlyBill,
    pshValue, setPshValue,
    targetSavings, setTargetSavings,
    batteryAutonomy, setBatteryAutonomy,
    motorAppliancesWatts, setMotorAppliancesWatts,
    nonMotorAppliancesWatts, setNonMotorAppliancesWatts,
    dayPvCapacity,
    nightPvCapacity,
    totalPvCapacity,
    isDataLoaded,
    calculationResults,
    
    initializeFromData,
    setPshFromIoT,
    calculateByArea,
    calculateByElectricity,
    calculateByLoadProfile,
    calculateByNetMetering,
    applyCalculationResults,
    resetCalculationCards,
    getPanelWattage,
    getPanelArea,
    getDepthOfDischarge,
    calculateInverterSize,
    calculateBatteryCapacity,
    getPanelWattageInWatts
  };
};