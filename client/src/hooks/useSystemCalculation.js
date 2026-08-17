// hooks/useSystemCalculation.js
import { useState } from 'react';

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
    const inverterSize = Math.ceil(calculateInverterSize() * 100) / 100;

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

   

    const inverterSize = Math.ceil(calculateInverterSize() * 100) / 100;
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
  const calculateByLoadProfile = () => {
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
    
   

    const inverterSize = Math.ceil(calculateInverterSize() * 100) / 100;
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

const calculateByNetMetering = () => {
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

  

  const inverterSize = Math.ceil(calculateInverterSize() * 100) / 100;
  const panelsNeeded = Math.ceil((recommendedSystemSize * 1000) / PANEL_WATTAGE_W);
  const batteryCapacityKwh = 0;

  const MIN_PSH = 3, MAX_PSH = 4.5;
  const annualProduction = Math.round((recommendedSystemSize * psh * 365) / 1.3);
  const annualProductionMin = Math.round((recommendedSystemSize * MIN_PSH * 365) / 1.3);
  const annualProductionMax = Math.round((recommendedSystemSize * MAX_PSH * 365) / 1.3);

  setCalculationResults({
    recommendedSystemSize,
    inverterSize,
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
    showToast
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

    if (availableInverters.length > 0 && calculationResults.inverterSize > 0) {
      const targetSize = calculationResults.inverterSize;
      const bestInverter = availableInverters.find(i => {
        const invSize = i.capacity?.value || i.power || 5;
        return Math.abs(invSize - targetSize) < 1;
      }) || availableInverters[0];
      setFreeQuoteSelectedInverter(bestInverter);
      setFreeQuoteInverterQuantity(1);
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