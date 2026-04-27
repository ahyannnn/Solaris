import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import '../../styles/Engineer/siteassessment.css';

const MyAssessments = () => {
  const [freeQuotes, setFreeQuotes] = useState([]);
  const [preAssessments, setPreAssessments] = useState([]);
  const [allAssessments, setAllAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedType, setSelectedType] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState('all');
  const [deployNotes, setDeployNotes] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [includeIoTData, setIncludeIoTData] = useState(true);
  const [analyzingData, setAnalyzingData] = useState(false);
  const [iotAnalysis, setIotAnalysis] = useState(null);
  const [config, setConfig] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);
  const [loadingMetrics, setLoadingMetrics] = useState(false);
  // Add this with your other state declarations (around line 100)

  const [laborCostPercentage, setLaborCostPercentage] = useState(20); // Default 20%
  const [overheadContingencyPercentage, setOverheadContingencyPercentage] = useState(15); // Default 15%
  const [contractorProfitPercentage, setContractorProfitPercentage] = useState(10); // Default 10%
  const [isEditingLaborCost, setIsEditingLaborCost] = useState(false);
  const [manualLaborCost, setManualLaborCost] = useState(0);

  // Modal states
  const [showDeployConfirmModal, setShowDeployConfirmModal] = useState(false);
  const [showReportConfirmModal, setShowReportConfirmModal] = useState(false);

  // New Quotation State with Equipment Selection
  const [selectedPanel, setSelectedPanel] = useState(null);
  const [selectedInverter, setSelectedInverter] = useState(null);
  const [selectedBattery, setSelectedBattery] = useState(null);
  const [panelQuantity, setPanelQuantity] = useState(1);
  const [inverterQuantity, setInverterQuantity] = useState(1);
  const [batteryQuantity, setBatteryQuantity] = useState(0);
  const [additionalEquipment, setAdditionalEquipment] = useState([]);
  const [selectedMountingStructure, setSelectedMountingStructure] = useState(null);
  const [mountingStructureQuantity, setMountingStructureQuantity] = useState(1);
  const [selectedElectricalComponents, setSelectedElectricalComponents] = useState([]);
  const [selectedCables, setSelectedCables] = useState([]);
  const [selectedJunctionBoxes, setSelectedJunctionBoxes] = useState([]);
  const [selectedDisconnectSwitches, setSelectedDisconnectSwitches] = useState([]);
  const [selectedMeters, setSelectedMeters] = useState([]);

  // Available equipment from config
  const [availablePanels, setAvailablePanels] = useState([]);
  const [availableInverters, setAvailableInverters] = useState([]);
  const [availableBatteries, setAvailableBatteries] = useState([]);
  const [availableMountingStructures, setAvailableMountingStructures] = useState([]);
  const [availableElectricalComponents, setAvailableElectricalComponents] = useState([]);
  const [availableCables, setAvailableCables] = useState([]);
  const [availableJunctionBoxes, setAvailableJunctionBoxes] = useState([]);
  const [availableDisconnectSwitches, setAvailableDisconnectSwitches] = useState([]);
  const [availableMeters, setAvailableMeters] = useState([]);

  // Free Quote Equipment States
  const [freeQuoteSelectedPanel, setFreeQuoteSelectedPanel] = useState(null);
  const [freeQuoteSelectedInverter, setFreeQuoteSelectedInverter] = useState(null);
  const [freeQuoteSelectedBattery, setFreeQuoteSelectedBattery] = useState(null);
  const [freeQuotePanelQuantity, setFreeQuotePanelQuantity] = useState(1);
  const [freeQuoteInverterQuantity, setFreeQuoteInverterQuantity] = useState(1);
  const [freeQuoteBatteryQuantity, setFreeQuoteBatteryQuantity] = useState(0);
  const [freeQuoteSelectedMountingStructure, setFreeQuoteSelectedMountingStructure] = useState(null);
  const [freeQuoteMountingStructureQuantity, setFreeQuoteMountingStructureQuantity] = useState(1);
  const [freeQuoteSelectedElectricalComponents, setFreeQuoteSelectedElectricalComponents] = useState([]);
  const [freeQuoteSelectedCables, setFreeQuoteSelectedCables] = useState([]);
  const [freeQuoteSelectedJunctionBoxes, setFreeQuoteSelectedJunctionBoxes] = useState([]);
  const [freeQuoteSelectedDisconnectSwitches, setFreeQuoteSelectedDisconnectSwitches] = useState([]);
  const [freeQuoteSelectedMeters, setFreeQuoteSelectedMeters] = useState([]);
  const [freeQuoteAdditionalEquipment, setFreeQuoteAdditionalEquipment] = useState([]);
  const [freeQuoteCalculatedCosts, setFreeQuoteCalculatedCosts] = useState({
    panelCost: 0,
    inverterCost: 0,
    batteryCost: 0,
    mountingCost: 0,
    electricalCost: 0,
    cableCost: 0,
    junctionBoxCost: 0,
    disconnectSwitchCost: 0,
    meterCost: 0,
    additionalCost: 0,
    totalEquipmentCost: 0,
    installationLaborCost: 0,
    subtotalCost: 0, // New: Equipment + Labor
    overheadContingencyCost: 0, // New
    contractorProfitCost: 0, // New
    totalSystemCost: 0
  });
  const [calculatedCosts, setCalculatedCosts] = useState({
    panelCost: 0,
    inverterCost: 0,
    batteryCost: 0,
    mountingCost: 0,
    electricalCost: 0,
    cableCost: 0,
    junctionBoxCost: 0,
    disconnectSwitchCost: 0,
    meterCost: 0,
    additionalCost: 0,
    totalEquipmentCost: 0,
    installationLaborCost: 0,
    subtotalCost: 0, // New: Equipment + Labor
    overheadContingencyCost: 0, // New
    contractorProfitCost: 0, // New
    totalSystemCost: 0
  });

  // Free Quote Form State
  const [freeQuoteForm, setFreeQuoteForm] = useState({
    quotationNumber: '',
    quotationExpiryDate: '',
    systemSize: '',
    systemType: 'grid-tie',
    panelsNeeded: '',
    panelType: '',
    inverterType: '',
    batteryType: '',
    installationCost: 0,
    equipmentCost: 0,
    totalCost: 0,
    paymentTerms: '',
    warrantyYears: 10,
    remarks: '',
    roofLength: '',
    roofWidth: ''
  });

  // Pre-Assessment Form State
  const [assessmentForm, setAssessmentForm] = useState({
    roofCondition: '',
    roofLength: '',
    roofWidth: '',
    structuralIntegrity: '',
    estimatedInstallationTime: '',
    recommendations: '',
    technicalFindings: '',
    siteVisitNotes: ''
  });

  // Quotation Form State
  const [quotationForm, setQuotationForm] = useState({
    quotationNumber: '',
    quotationExpiryDate: '',
    systemSize: '',
    systemType: 'grid-tie',
    panelsNeeded: '',
    panelType: '',
    inverterType: '',
    batteryType: '',
    installationCost: 0,
    equipmentCost: 0,
    totalCost: 0,
    paymentTerms: '',
    warrantyYears: 10
  });

  const [siteImages, setSiteImages] = useState([]);

  // Get API base URL from environment
  const getApiBaseUrl = () => {
    return import.meta.env.VITE_API_URL || '';
  };

  const API_BASE_URL = getApiBaseUrl();

  // Helper functions
  const generateQuotationNumber = () => {
    const prefix = 'Q';
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `${prefix}-${year}${month}-${random}`;
  };

  const getExpiryDate30Days = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().split('T')[0];
  };

  const showToast = (message, type) => {
    alert(message);
  };

  // ============ NEW: Fetch system recommendations from backend ============
  const fetchSystemRecommendations = async (assessmentId) => {
    try {
      setLoadingMetrics(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(
        `${API_BASE_URL}/api/pre-assessments/${assessmentId}/system-recommendations`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setSystemMetrics(response.data.systemMetrics);
        return response.data.systemMetrics;
      }
      return null;
    } catch (error) {
      console.error('Error fetching system recommendations:', error);
      showToast('Failed to load system recommendations', 'error');
      return null;
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Free Quote Equipment helper functions
  const freeQuoteAddElectricalComponent = () => {
    setFreeQuoteSelectedElectricalComponents([...freeQuoteSelectedElectricalComponents, { id: null, quantity: 1, total: 0 }]);
  };

  const freeQuoteUpdateElectricalComponent = (index, field, value) => {
    const updated = [...freeQuoteSelectedElectricalComponents];
    updated[index][field] = value;
    if (field === 'id' || field === 'quantity') {
      const component = availableElectricalComponents.find(c => c._id === updated[index].id);
      if (component) {
        updated[index].total = (updated[index].quantity || 1) * component.price;
        updated[index].name = component.name;
        updated[index].price = component.price;
      }
    }
    setFreeQuoteSelectedElectricalComponents(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteRemoveElectricalComponent = (index) => {
    const updated = freeQuoteSelectedElectricalComponents.filter((_, i) => i !== index);
    setFreeQuoteSelectedElectricalComponents(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteAddCable = () => {
    setFreeQuoteSelectedCables([...freeQuoteSelectedCables, { id: null, quantity: 1, total: 0, length: 10 }]);
  };

  const freeQuoteUpdateCable = (index, field, value) => {
    const updated = [...freeQuoteSelectedCables];
    updated[index][field] = value;
    if (field === 'id' || field === 'quantity' || field === 'length') {
      const cable = availableCables.find(c => c._id === updated[index].id);
      if (cable) {
        const totalLength = (updated[index].length || 10) * (updated[index].quantity || 1);
        updated[index].total = totalLength * cable.price;
        updated[index].name = cable.name;
        updated[index].price = cable.price;
      }
    }
    setFreeQuoteSelectedCables(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteRemoveCable = (index) => {
    const updated = freeQuoteSelectedCables.filter((_, i) => i !== index);
    setFreeQuoteSelectedCables(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteAddJunctionBox = () => {
    setFreeQuoteSelectedJunctionBoxes([...freeQuoteSelectedJunctionBoxes, { id: null, quantity: 1, total: 0 }]);
  };

  const freeQuoteUpdateJunctionBox = (index, field, value) => {
    const updated = [...freeQuoteSelectedJunctionBoxes];
    updated[index][field] = value;
    if (field === 'id' || field === 'quantity') {
      const box = availableJunctionBoxes.find(b => b._id === updated[index].id);
      if (box) {
        updated[index].total = (updated[index].quantity || 1) * box.price;
        updated[index].name = box.name;
        updated[index].price = box.price;
      }
    }
    setFreeQuoteSelectedJunctionBoxes(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteRemoveJunctionBox = (index) => {
    const updated = freeQuoteSelectedJunctionBoxes.filter((_, i) => i !== index);
    setFreeQuoteSelectedJunctionBoxes(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteAddDisconnectSwitch = () => {
    setFreeQuoteSelectedDisconnectSwitches([...freeQuoteSelectedDisconnectSwitches, { id: null, quantity: 1, total: 0 }]);
  };

  const freeQuoteUpdateDisconnectSwitch = (index, field, value) => {
    const updated = [...freeQuoteSelectedDisconnectSwitches];
    updated[index][field] = value;
    if (field === 'id' || field === 'quantity') {
      const sw = availableDisconnectSwitches.find(s => s._id === updated[index].id);
      if (sw) {
        updated[index].total = (updated[index].quantity || 1) * sw.price;
        updated[index].name = sw.name;
        updated[index].price = sw.price;
      }
    }
    setFreeQuoteSelectedDisconnectSwitches(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteRemoveDisconnectSwitch = (index) => {
    const updated = freeQuoteSelectedDisconnectSwitches.filter((_, i) => i !== index);
    setFreeQuoteSelectedDisconnectSwitches(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteAddMeter = () => {
    setFreeQuoteSelectedMeters([...freeQuoteSelectedMeters, { id: null, quantity: 1, total: 0 }]);
  };

  const freeQuoteUpdateMeter = (index, field, value) => {
    const updated = [...freeQuoteSelectedMeters];
    updated[index][field] = value;
    if (field === 'id' || field === 'quantity') {
      const meter = availableMeters.find(m => m._id === updated[index].id);
      if (meter) {
        updated[index].total = (updated[index].quantity || 1) * meter.price;
        updated[index].name = meter.name;
        updated[index].price = meter.price;
      }
    }
    setFreeQuoteSelectedMeters(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteRemoveMeter = (index) => {
    const updated = freeQuoteSelectedMeters.filter((_, i) => i !== index);
    setFreeQuoteSelectedMeters(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteAddAdditionalEquipment = () => {
    setFreeQuoteAdditionalEquipment([...freeQuoteAdditionalEquipment, { name: '', quantity: 1, price: 0, total: 0 }]);
  };

  const freeQuoteUpdateAdditionalEquipment = (index, field, value) => {
    const updated = [...freeQuoteAdditionalEquipment];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'price') {
      updated[index].total = (updated[index].quantity || 0) * (updated[index].price || 0);
    }
    setFreeQuoteAdditionalEquipment(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteRemoveAdditionalEquipment = (index) => {
    const updated = freeQuoteAdditionalEquipment.filter((_, i) => i !== index);
    setFreeQuoteAdditionalEquipment(updated);
    setTimeout(() => freeQuoteCalculateTotalCosts(), 0);
  };

  const freeQuoteCalculateTotalCosts = () => {
    let panelCost = 0;
    if (freeQuoteSelectedPanel) {
      if (freeQuoteSelectedPanel.unit === 'watt') {
        const systemSizeWatts = (freeQuoteForm.systemSize || 0) * 1000;
        panelCost = freeQuoteSelectedPanel.price * systemSizeWatts;
      } else {
        panelCost = freeQuoteSelectedPanel.price * freeQuotePanelQuantity;
      }
    }

    let inverterCost = 0;
    if (freeQuoteSelectedInverter) {
      inverterCost = freeQuoteSelectedInverter.price * freeQuoteInverterQuantity;
    }

    let batteryCost = 0;
    if (freeQuoteSelectedBattery) {
      batteryCost = freeQuoteSelectedBattery.price * freeQuoteBatteryQuantity;
    }

    let mountingCost = 0;
    if (freeQuoteSelectedMountingStructure) {
      mountingCost = freeQuoteSelectedMountingStructure.price * freeQuoteMountingStructureQuantity;
    }

    let electricalCost = freeQuoteSelectedElectricalComponents.reduce((sum, item) => sum + (item.total || 0), 0);
    let cableCost = freeQuoteSelectedCables.reduce((sum, item) => sum + (item.total || 0), 0);
    let junctionBoxCost = freeQuoteSelectedJunctionBoxes.reduce((sum, item) => sum + (item.total || 0), 0);
    let disconnectSwitchCost = freeQuoteSelectedDisconnectSwitches.reduce((sum, item) => sum + (item.total || 0), 0);
    let meterCost = freeQuoteSelectedMeters.reduce((sum, item) => sum + (item.total || 0), 0);
    let additionalCost = freeQuoteAdditionalEquipment.reduce((sum, item) => sum + (item.total || 0), 0);

    const totalEquipmentCost = panelCost + inverterCost + batteryCost + mountingCost +
      electricalCost + cableCost + junctionBoxCost + disconnectSwitchCost + meterCost + additionalCost;

    // Calculate installation labor cost based on percentage
    const installationLaborCost = totalEquipmentCost * (laborCostPercentage / 100);

    // ✅ Calculate subtotal (Equipment + Labor)
    const subtotalCost = totalEquipmentCost + installationLaborCost;

    // ✅ Calculate Overhead & Contingency (based on subtotal)
    const overheadContingencyCost = subtotalCost * (overheadContingencyPercentage / 100);

    // ✅ Calculate Contractor Profit (based on subtotal)
    const contractorProfitCost = subtotalCost * (contractorProfitPercentage / 100);

    // ✅ Total System Cost = Subtotal + Overhead & Contingency + Contractor Profit
    const totalSystemCost = subtotalCost + overheadContingencyCost + contractorProfitCost;

    setFreeQuoteCalculatedCosts({
      panelCost,
      inverterCost,
      batteryCost,
      mountingCost,
      electricalCost,
      cableCost,
      junctionBoxCost,
      disconnectSwitchCost,
      meterCost,
      additionalCost,
      totalEquipmentCost,
      installationLaborCost,
      subtotalCost,                    // ✅ Added
      overheadContingencyCost,         // ✅ Added
      contractorProfitCost,            // ✅ Added
      totalSystemCost
    });

    setFreeQuoteForm(prev => ({
      ...prev,
      equipmentCost: totalEquipmentCost,
      installationCost: installationLaborCost,
      totalCost: totalSystemCost,
      panelsNeeded: freeQuotePanelQuantity
    }));
  }

  // Pre-Assessment Equipment helper functions
  const addCable = () => {
    setSelectedCables([...selectedCables, { id: null, quantity: 1, total: 0, length: 10 }]);
  };

  const updateCable = (index, field, value) => {
    const updated = [...selectedCables];
    updated[index][field] = value;
    if (field === 'id' || field === 'quantity' || field === 'length') {
      const cable = availableCables.find(c => c._id === updated[index].id);
      if (cable) {
        const totalLength = (updated[index].length || 10) * (updated[index].quantity || 1);
        updated[index].total = totalLength * cable.price;
        updated[index].name = cable.name;
        updated[index].price = cable.price;
      }
    }
    setSelectedCables(updated);
  };

  // Calculate roof area in square meters
  const calculateRoofArea = (length, width) => {
    const l = parseFloat(length) || 0;
    const w = parseFloat(width) || 0;
    if (l > 0 && w > 0) {
      return (l * w).toFixed(1);
    }
    return null;
  };

  const removeCable = (index) => {
    const updated = selectedCables.filter((_, i) => i !== index);
    setSelectedCables(updated);
  };

  const addJunctionBox = () => {
    setSelectedJunctionBoxes([...selectedJunctionBoxes, { id: null, quantity: 1, total: 0 }]);
  };

  const updateJunctionBox = (index, field, value) => {
    const updated = [...selectedJunctionBoxes];
    updated[index][field] = value;
    if (field === 'id' || field === 'quantity') {
      const box = availableJunctionBoxes.find(b => b._id === updated[index].id);
      if (box) {
        updated[index].total = (updated[index].quantity || 1) * box.price;
        updated[index].name = box.name;
        updated[index].price = box.price;
      }
    }
    setSelectedJunctionBoxes(updated);
    setTimeout(() => calculateTotalCosts(), 0);
  };

  const removeJunctionBox = (index) => {
    const updated = selectedJunctionBoxes.filter((_, i) => i !== index);
    setSelectedJunctionBoxes(updated);
  };

  const addDisconnectSwitch = () => {
    setSelectedDisconnectSwitches([...selectedDisconnectSwitches, { id: null, quantity: 1, total: 0 }]);
  };

  const updateDisconnectSwitch = (index, field, value) => {
    const updated = [...selectedDisconnectSwitches];
    updated[index][field] = value;
    if (field === 'id' || field === 'quantity') {
      const sw = availableDisconnectSwitches.find(s => s._id === updated[index].id);
      if (sw) {
        updated[index].total = (updated[index].quantity || 1) * sw.price;
        updated[index].name = sw.name;
        updated[index].price = sw.price;
      }
    }
    setSelectedDisconnectSwitches(updated);
  };

  const removeDisconnectSwitch = (index) => {
    const updated = selectedDisconnectSwitches.filter((_, i) => i !== index);
    setSelectedDisconnectSwitches(updated);
  };

  const addMeter = () => {
    setSelectedMeters([...selectedMeters, { id: null, quantity: 1, total: 0 }]);
  };

  const updateMeter = (index, field, value) => {
    const updated = [...selectedMeters];
    updated[index][field] = value;
    if (field === 'id' || field === 'quantity') {
      const meter = availableMeters.find(m => m._id === updated[index].id);
      if (meter) {
        updated[index].total = (updated[index].quantity || 1) * meter.price;
        updated[index].name = meter.name;
        updated[index].price = meter.price;
      }
    }
    setSelectedMeters(updated);
  };

  const removeMeter = (index) => {
    const updated = selectedMeters.filter((_, i) => i !== index);
    setSelectedMeters(updated);
  };

  const addElectricalComponent = () => {
    setSelectedElectricalComponents([...selectedElectricalComponents, { id: null, quantity: 1, total: 0 }]);
  };

  const updateElectricalComponent = (index, field, value) => {
    const updated = [...selectedElectricalComponents];
    updated[index][field] = value;
    if (field === 'id' || field === 'quantity') {
      const component = availableElectricalComponents.find(c => c._id === updated[index].id);
      if (component) {
        updated[index].total = (updated[index].quantity || 1) * component.price;
        updated[index].name = component.name;
        updated[index].price = component.price;
      }
    }
    setSelectedElectricalComponents(updated);
    setTimeout(() => calculateTotalCosts(), 0);
  };

  const removeElectricalComponent = (index) => {
    const updated = selectedElectricalComponents.filter((_, i) => i !== index);
    setSelectedElectricalComponents(updated);
    setTimeout(() => calculateTotalCosts(), 0);
  };

  const addAdditionalEquipment = () => {
    setAdditionalEquipment([...additionalEquipment, { name: '', quantity: 1, price: 0, total: 0 }]);
  };

  const updateAdditionalEquipment = (index, field, value) => {
    const updated = [...additionalEquipment];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'price') {
      updated[index].total = (updated[index].quantity || 0) * (updated[index].price || 0);
    }
    setAdditionalEquipment(updated);
    setTimeout(() => calculateTotalCosts(), 0);
  };

  const removeAdditionalEquipment = (index) => {
    const updated = additionalEquipment.filter((_, i) => i !== index);
    setAdditionalEquipment(updated);
    setTimeout(() => calculateTotalCosts(), 0);
  };

  const calculateTotalCosts = () => {
    let panelCost = 0;
    if (selectedPanel) {
      if (selectedPanel.unit === 'watt') {
        const systemSizeWatts = (quotationForm.systemSize || 0) * 1000;
        panelCost = selectedPanel.price * systemSizeWatts;
      } else {
        panelCost = selectedPanel.price * panelQuantity;
      }
    }

    let inverterCost = 0;
    if (selectedInverter) {
      inverterCost = selectedInverter.price * inverterQuantity;
    }

    let batteryCost = 0;
    if (selectedBattery) {
      batteryCost = selectedBattery.price * batteryQuantity;
    }

    let mountingCost = 0;
    if (selectedMountingStructure) {
      mountingCost = selectedMountingStructure.price * mountingStructureQuantity;
    }

    let electricalCost = selectedElectricalComponents.reduce((sum, item) => sum + (item.total || 0), 0);
    let cableCost = selectedCables.reduce((sum, item) => sum + (item.total || 0), 0);
    let junctionBoxCost = selectedJunctionBoxes.reduce((sum, item) => sum + (item.total || 0), 0);
    let disconnectSwitchCost = selectedDisconnectSwitches.reduce((sum, item) => sum + (item.total || 0), 0);
    let meterCost = selectedMeters.reduce((sum, item) => sum + (item.total || 0), 0);
    let additionalCost = additionalEquipment.reduce((sum, item) => sum + (item.total || 0), 0);

    const totalEquipmentCost = panelCost + inverterCost + batteryCost + mountingCost +
      electricalCost + cableCost + junctionBoxCost + disconnectSwitchCost + meterCost + additionalCost;

    // Calculate installation labor cost based on percentage
    const installationLaborCost = totalEquipmentCost * (laborCostPercentage / 100);

    // ✅ Calculate subtotal (Equipment + Labor)
    const subtotalCost = totalEquipmentCost + installationLaborCost;

    // ✅ Calculate Overhead & Contingency (based on subtotal)
    const overheadContingencyCost = subtotalCost * (overheadContingencyPercentage / 100);

    // ✅ Calculate Contractor Profit (based on subtotal)
    const contractorProfitCost = subtotalCost * (contractorProfitPercentage / 100);

    // ✅ Total System Cost = Subtotal + Overhead & Contingency + Contractor Profit
    const totalSystemCost = subtotalCost + overheadContingencyCost + contractorProfitCost;

    setCalculatedCosts({
      panelCost,
      inverterCost,
      batteryCost,
      mountingCost,
      electricalCost,
      cableCost,
      junctionBoxCost,
      disconnectSwitchCost,
      meterCost,
      additionalCost,
      totalEquipmentCost,
      installationLaborCost,
      subtotalCost,                    // ✅ Added
      overheadContingencyCost,         // ✅ Added
      contractorProfitCost,            // ✅ Added
      totalSystemCost
    });

    setQuotationForm(prev => ({
      ...prev,
      equipmentCost: totalEquipmentCost,
      installationCost: installationLaborCost,
      totalCost: totalSystemCost,
      panelsNeeded: panelQuantity
    }));
  }

  const ASSESSMENT_TYPES = {
    free_quote: {
      label: 'Free Quote',
      color: 'free-quote-enad',
      statusKey: 'status'
    },
    pre_assessment: {
      label: 'Pre-Assessment',
      color: 'pre-assessment-enad',
      statusKey: 'assessmentStatus'
    }
  };

  const FREE_QUOTE_STATUS = {
    pending: { label: 'Pending', color: 'pending-enad' },
    assigned: { label: 'Assigned', color: 'processing-enad' },
    processing: { label: 'Processing', color: 'processing-enad' },
    completed: { label: 'Completed', color: 'completed-enad' },
    cancelled: { label: 'Cancelled', color: 'cancelled-enad' }
  };

  const PRE_ASSESSMENT_STATUS = {
    pending_payment: { label: 'Pending Payment', color: 'pending-enad' },
    scheduled: { label: 'Scheduled', color: 'scheduled-enad' },
    site_visit_ongoing: { label: 'Site Visit Ongoing', color: 'site-visit-enad' },
    device_deployed: { label: 'Device Deployed', color: 'device-deployed-enad' },
    data_collecting: { label: 'Collecting Data', color: 'data-collecting-enad' },
    data_analyzing: { label: 'Analyzing Data', color: 'data-analyzing-enad' },
    report_draft: { label: 'Report Draft', color: 'report-draft-enad' },
    completed: { label: 'Completed', color: 'completed-enad' },
    cancelled: { label: 'Cancelled', color: 'cancelled-enad' }
  };

  const ROOF_CONDITIONS = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  const STRUCTURAL_INTEGRITY = [
    { value: 'excellent', label: 'Excellent' },
    { value: 'good', label: 'Good' },
    { value: 'fair', label: 'Fair' },
    { value: 'poor', label: 'Poor' }
  ];

  const SYSTEM_TYPES = [
    { value: 'grid-tie', label: 'Grid-Tie System', description: 'Connected to utility grid, no batteries' },
    { value: 'hybrid', label: 'Hybrid System', description: 'Grid-tie with battery backup' },
    { value: 'off-grid', label: 'Off-Grid System', description: 'Standalone with batteries, not connected to grid' }
  ];

  // Fetch all equipment
  const fetchAllEquipment = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        showToast('Authentication token not found. Please login again.', 'error');
        return;
      }

      const [panelsRes, invertersRes, batteriesRes, mountingRes, electricalRes, cablesRes, junctionBoxesRes, switchesRes, metersRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/maintenance/config/equipment/solarPanels`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/maintenance/config/equipment/inverters`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/maintenance/config/equipment/batteries`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/maintenance/config/equipment/mountingStructures`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/maintenance/config/equipment/electricalComponents`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/maintenance/config/equipment/cablesAndWiring`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/maintenance/config/equipment/junctionBoxes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/maintenance/config/equipment/disconnectSwitches`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/maintenance/config/equipment/meters`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      setAvailablePanels(panelsRes.data.items || []);
      setAvailableInverters(invertersRes.data.items || []);
      setAvailableBatteries(batteriesRes.data.items || []);
      setAvailableMountingStructures(mountingRes.data.items || []);
      setAvailableElectricalComponents(electricalRes.data.items || []);
      setAvailableCables(cablesRes.data.items || []);
      setAvailableJunctionBoxes(junctionBoxesRes.data.items || []);
      setAvailableDisconnectSwitches(switchesRes.data.items || []);
      setAvailableMeters(metersRes.data.items || []);
    } catch (error) {
      console.error('Error fetching equipment:', error);
      showToast('Failed to load equipment data', 'error');
    }
  };

  const fetchSystemConfig = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/maintenance/config`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setConfig(response.data.config);
      await fetchAllEquipment();
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  // API Calls
  const fetchAllAssessments = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) {
        showToast('Please login again to continue', 'error');
        setLoading(false);
        return;
      }

      const [freeQuotesRes, preAssessmentsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/free-quotes/engineer/my-quotes`, { headers: { Authorization: `Bearer ${token}` } }),
        axios.get(`${API_BASE_URL}/api/pre-assessments/engineer/my-assessments`, { headers: { Authorization: `Bearer ${token}` } })
      ]);

      const formattedFreeQuotes = (freeQuotesRes.data.quotes || []).map(quote => ({
        ...quote,
        type: 'free_quote',
        id: quote._id,
        clientId: quote.clientId?._id,
        clientName: quote.clientId?.contactFirstName || '',
        clientLastName: quote.clientId?.contactLastName || '',
        clientEmail: quote.clientId?.userId?.email || '',
        clientPhone: quote.clientId?.contactNumber || '',
        clientType: quote.clientId?.client_type || 'Residential',
        address: quote.addressId,
        bookingReference: quote.quotationReference,
        status: quote.status,
        preferredDate: quote.requestedAt,
        propertyType: quote.propertyType,
        desiredCapacity: quote.desiredCapacity,
        systemType: quote.systemType,
        monthlyBill: quote.monthlyBill,
        roofLength: quote.roofLength,
        roofWidth: quote.roofWidth
      }));

      const formattedPreAssessments = (preAssessmentsRes.data.assessments || []).map(assessment => ({
        ...assessment,
        type: 'pre_assessment',
        id: assessment._id,
        clientId: assessment.clientId?._id,
        clientName: assessment.clientId?.contactFirstName || '',
        clientLastName: assessment.clientId?.contactLastName || '',
        clientEmail: assessment.clientId?.userId?.email || '',
        clientPhone: assessment.clientId?.contactNumber || '',
        clientType: assessment.clientId?.client_type || 'Residential',
        address: assessment.addressId,
        status: assessment.assessmentStatus,
        preferredDate: assessment.preferredDate,
        propertyType: assessment.propertyType,
        desiredCapacity: assessment.desiredCapacity,
        systemType: assessment.systemType,
        roofType: assessment.roofType,
        roofLength: assessment.roofLength,
        roofWidth: assessment.roofWidth,
        assignedDevice: assessment.assignedDevice,
        assignedDeviceId: assessment.assignedDeviceId,
        iotDeviceId: assessment.iotDeviceId,
        deviceDeployedAt: assessment.deviceDeployedAt,
        deviceDeployedBy: assessment.deviceDeployedBy,
        dataCollectionStart: assessment.dataCollectionStart,
        dataCollectionEnd: assessment.dataCollectionEnd,
        totalReadings: assessment.totalReadings
      }));

      setFreeQuotes(formattedFreeQuotes);
      setPreAssessments(formattedPreAssessments);
      setAllAssessments([...formattedFreeQuotes, ...formattedPreAssessments]);
      setError(null);
    } catch (err) {
      console.error('Error fetching assessments:', err);
      let errorMessage = 'Failed to load assessments. ';
      if (err.response?.status === 401) errorMessage += 'Authentication failed. Please login again.';
      else if (err.response?.status === 404) errorMessage += 'API endpoint not found.';
      else if (err.code === 'ERR_NETWORK') errorMessage += 'Network error. Cannot connect to server.';
      else errorMessage += err.response?.data?.message || err.message;
      showToast(errorMessage, 'error');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const fetchFreeQuoteDetails = async (quoteId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/free-quotes/${quoteId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const quote = response.data.quote;

      let addressData = null;
      if (selectedItem && selectedItem.address) {
        addressData = selectedItem.address;
      } else if (quote.addressId && typeof quote.addressId === 'object') {
        addressData = quote.addressId;
      } else if (quote.address && typeof quote.address === 'object') {
        addressData = quote.address;
      } else if (quote.addressId && typeof quote.addressId === 'string') {
        const foundQuote = freeQuotes.find(fq => fq.id === quoteId);
        if (foundQuote && foundQuote.address) addressData = foundQuote.address;
      }

      const formattedQuote = {
        ...quote,
        clientName: quote.clientId?.contactFirstName || '',
        clientLastName: quote.clientId?.contactLastName || '',
        clientEmail: quote.clientId?.userId?.email || '',
        clientPhone: quote.clientId?.contactNumber || '',
        clientType: quote.clientId?.client_type || 'Residential',
        address: addressData,
        systemType: quote.systemType,
        roofLength: quote.roofLength,
        roofWidth: quote.roofWidth
      };

      setSelectedItem(formattedQuote);
      setSelectedType('free_quote');
      const autoExpiryDate = getExpiryDate30Days();

      setFreeQuoteForm({
        quotationNumber: formattedQuote.quotationReference || '',
        quotationExpiryDate: autoExpiryDate,
        systemSize: '',
        systemType: formattedQuote.systemType || 'grid-tie',
        panelsNeeded: '',
        panelType: '',
        inverterType: '',
        batteryType: '',
        installationCost: 0,
        equipmentCost: 0,
        totalCost: 0,
        paymentTerms: '',
        warrantyYears: 10,
        remarks: formattedQuote.adminRemarks || '',
        roofLength: formattedQuote.roofLength || '',
        roofWidth: formattedQuote.roofWidth || ''
      });
    } catch (err) {
      console.error('Error fetching free quote details:', err);
      showToast('Failed to load quote details', 'error');
    }
  };

  const fetchPreAssessmentDetails = async (assessmentId) => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/api/pre-assessments/${assessmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const assessment = response.data.assessment;

      let addressData = null;
      if (selectedItem && selectedItem.address) {
        addressData = selectedItem.address;
      } else if (assessment.addressId && typeof assessment.addressId === 'object') {
        addressData = assessment.addressId;
      } else if (assessment.address && typeof assessment.address === 'object') {
        addressData = assessment.address;
      } else if (assessment.addressId && typeof assessment.addressId === 'string') {
        const foundAssessment = preAssessments.find(pa => pa.id === assessmentId);
        if (foundAssessment && foundAssessment.address) addressData = foundAssessment.address;
      }

      const formattedAssessment = {
        ...assessment,
        clientName: assessment.clientId?.contactFirstName || '',
        clientLastName: assessment.clientId?.contactLastName || '',
        clientEmail: assessment.clientId?.userId?.email || '',
        clientPhone: assessment.clientId?.contactNumber || '',
        clientType: assessment.clientId?.client_type || 'Residential',
        assignedDevice: assessment.assignedDevice,
        assignedDeviceId: assessment.assignedDeviceId,
        iotDeviceId: assessment.iotDeviceId,
        deviceDeployedAt: assessment.deviceDeployedAt,
        deviceDeployedBy: assessment.deviceDeployedBy,
        address: addressData,
        systemType: assessment.systemType,
        roofType: assessment.roofType,
        roofLength: assessment.roofLength,
        roofWidth: assessment.roofWidth,
        dataCollectionStart: assessment.dataCollectionStart,
        dataCollectionEnd: assessment.dataCollectionEnd,
        totalReadings: assessment.totalReadings,
        monthlyBill: assessment.monthlyBill || 0,
        rate: assessment.rate || 0,
        consumption: assessment.consumption || 0,
        dayconsumption: assessment.dayConsumption || 0,
        nightConsumption: assessment.nightConsumption || 0,
        dayPercentage: assessment.dayPercentage || 0,
        nightPercentage: assessment.nightPercentage || 0,
        totalDailyConsumption: assessment.totalDailyConsumption || 0,
        targetSavings: assessment.targetSavings || 0
      };

      setSelectedItem(formattedAssessment);
      setSelectedType('pre_assessment');

      if (assessment.engineerAssessment) {
        setAssessmentForm({
          roofCondition: assessment.engineerAssessment.roofCondition || '',
          roofLength: assessment.engineerAssessment.roofLength || formattedAssessment.roofLength || '',
          roofWidth: assessment.engineerAssessment.roofWidth || formattedAssessment.roofWidth || '',
          structuralIntegrity: assessment.engineerAssessment.structuralIntegrity || '',
          estimatedInstallationTime: assessment.engineerAssessment.estimatedInstallationTime || '',
          recommendations: assessment.engineerAssessment.recommendations || '',
          technicalFindings: assessment.technicalFindings || '',
          siteVisitNotes: assessment.engineerAssessment.inspectionNotes || ''
        });
      } else {
        setAssessmentForm({
          roofCondition: '',
          roofLength: formattedAssessment.roofLength || '',
          roofWidth: formattedAssessment.roofWidth || '',
          structuralIntegrity: '',
          estimatedInstallationTime: '',
          recommendations: '',
          technicalFindings: '',
          siteVisitNotes: ''
        });
      }

      const autoQuotationNumber = generateQuotationNumber();
      const autoExpiryDate = getExpiryDate30Days();

      if (assessment.quotation?.systemDetails) {
        setQuotationForm({
          quotationNumber: assessment.quotation.quotationNumber || autoQuotationNumber,
          quotationExpiryDate: assessment.quotation.quotationExpiryDate?.split('T')[0] || autoExpiryDate,
          systemSize: assessment.quotation.systemDetails.systemSize || '',
          systemType: assessment.quotation.systemDetails.systemType || formattedAssessment.systemType || 'grid-tie',
          panelsNeeded: assessment.quotation.systemDetails.panelsNeeded || '',
          panelType: assessment.quotation.systemDetails.panelType || '',
          inverterType: assessment.quotation.systemDetails.inverterType || '',
          batteryType: assessment.quotation.systemDetails.batteryType || '',
          installationCost: assessment.quotation.systemDetails.installationCost || 0,
          equipmentCost: assessment.quotation.systemDetails.equipmentCost || 0,
          totalCost: assessment.quotation.systemDetails.totalCost || 0,
          paymentTerms: assessment.quotation.systemDetails.paymentTerms || '',
          warrantyYears: assessment.quotation.systemDetails.warrantyYears || 10
        });
      } else {
        setQuotationForm({
          quotationNumber: autoQuotationNumber,
          quotationExpiryDate: autoExpiryDate,
          systemSize: '',
          systemType: formattedAssessment.systemType || 'grid-tie',
          panelsNeeded: '',
          panelType: '',
          inverterType: '',
          batteryType: '',
          installationCost: 0,
          equipmentCost: 0,
          totalCost: 0,
          paymentTerms: '',
          warrantyYears: 10
        });
      }

      if (assessment.assessmentResults) {
        setAssessmentResults(assessment.assessmentResults);

        // Fetch system recommendations from backend
        const metrics = await fetchSystemRecommendations(assessmentId);

        if (metrics && !quotationForm.systemSize) {
          setQuotationForm(prev => ({
            ...prev,
            systemSize: metrics.recommendedSystemSize,
            panelsNeeded: metrics.panelsNeeded.toString()
          }));
        }
      }

      if (assessment.sitePhotos) {
        setSiteImages(assessment.sitePhotos);
      }
    } catch (err) {
      console.error('Error fetching pre-assessment details:', err);
      showToast('Failed to load assessment details', 'error');
    }
  };

  const analyzeIoTData = async () => {
    if (!selectedItem || selectedType !== 'pre_assessment') return;
    setAnalyzingData(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/analyze-iot-data`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setIotAnalysis(response.data.analysis);
      showToast('IoT data analysis completed successfully!', 'success');
      await fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      console.error('Error analyzing IoT data:', err);
      showToast(err.response?.data?.message || 'Failed to analyze IoT data', 'error');
    } finally {
      setAnalyzingData(false);
    }
  };

  // Main PDF Generation Function
  const generateQuotationPDF = async () => {
    const isFreeQuote = selectedType === 'free_quote';

    const systemSize = isFreeQuote ? freeQuoteForm.systemSize : quotationForm.systemSize;
    const totalCost = isFreeQuote ? freeQuoteCalculatedCosts.totalSystemCost : calculatedCosts.totalSystemCost;

    if (!systemSize || parseFloat(systemSize) <= 0) {
      showToast('Please enter a valid system size (greater than 0)', 'warning');
      return;
    }

    if (!totalCost || parseFloat(totalCost) <= 0) {
      showToast('Please enter a valid total cost (greater than 0)', 'warning');
      return;
    }

    setGeneratingPDF(true);
    try {
      const token = sessionStorage.getItem('token');
      const endpoint = isFreeQuote
        ? `${API_BASE_URL}/api/free-quotes/${selectedItem._id}/generate-quotation`
        : `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/generate-quotation`;

      const iotDataForPDF = !isFreeQuote ? {
        totalReadings: assessmentResults?.totalReadings || 0,
        peakSunHours: systemMetrics?.peakSunHours || assessmentResults?.peakSunHours || 0,
        averageIrradiance: systemMetrics?.averageIrradiance || assessmentResults?.averageIrradiance || 0,
        maxIrradiance: systemMetrics?.maxIrradiance || assessmentResults?.maxIrradiance || 0,
        minIrradiance: systemMetrics?.minIrradiance || assessmentResults?.minIrradiance || 0,
        averageTemperature: systemMetrics?.averageTemperature || assessmentResults?.averageTemperature || 0,
        maxTemperature: systemMetrics?.maxTemperature || assessmentResults?.maxTemperature || 0,
        minTemperature: systemMetrics?.minTemperature || assessmentResults?.minTemperature || 0,
        temperatureDerating: systemMetrics?.temperatureDerating || 0,
        averageHumidity: systemMetrics?.averageHumidity || assessmentResults?.averageHumidity || 0,
        maxHumidity: systemMetrics?.maxHumidity || assessmentResults?.maxHumidity || 0,
        minHumidity: systemMetrics?.minHumidity || assessmentResults?.minHumidity || 0,
        shadingPercentage: systemMetrics?.shadingPercentage || 0,
        dataCollectionStart: selectedItem?.dataCollectionStart,
        dataCollectionEnd: selectedItem?.dataCollectionEnd,
        gpsCoordinates: systemMetrics?.gpsLocation || assessmentResults?.gpsCoordinates,
        optimalOrientation: systemMetrics?.optimalOrientation || 'South-facing',
        optimalTiltAngle: systemMetrics?.optimalTilt || 15,
        recommendedSystemSize: systemMetrics?.recommendedSystemSize || systemSize,
        panelsNeeded: systemMetrics?.panelsNeeded || panelQuantity,
        inverterSize: systemMetrics?.inverterSize || Math.ceil(parseFloat(systemSize) * 1.2),
        performanceRatio: systemMetrics?.performanceRatio || 85,
        estimatedMonthlySavings: systemMetrics?.estimatedMonthlySavings || 0,
        estimatedAnnualSavings: systemMetrics?.estimatedAnnualSavings || 0,
        paybackPeriod: systemMetrics?.paybackPeriod || 0,
        estimatedAnnualProduction: systemMetrics?.estimatedAnnualProduction || (parseFloat(systemSize) * 1200),
        co2Offset: systemMetrics?.co2Offset || (parseFloat(systemSize) * 800),
        roofArea: systemMetrics?.availableRoofArea || (assessmentForm.roofLength * assessmentForm.roofWidth),
        estimatedInstallationTime: systemMetrics?.estimatedInstallationTime || assessmentForm.estimatedInstallationTime || 3,
        roofCondition: assessmentForm.roofCondition,
        structuralIntegrity: assessmentForm.structuralIntegrity,
        temperatureRange: systemMetrics?.temperatureRange || `${assessmentResults?.minTemperature || 25}°C - ${assessmentResults?.maxTemperature || 32}°C`,
        irradianceLevel: systemMetrics?.averageIrradiance || 0,
        siteSuitabilityScore: systemMetrics?.siteSuitabilityScore || 85
      } : null;

      const payload = isFreeQuote ? {
        quotationNumber: freeQuoteForm.quotationNumber,
        quotationExpiryDate: freeQuoteForm.quotationExpiryDate,
        systemSize: parseFloat(freeQuoteForm.systemSize),
        systemType: freeQuoteForm.systemType,
        panelsNeeded: freeQuotePanelQuantity,
        panelType: freeQuoteSelectedPanel?.name || '',
        inverterType: freeQuoteSelectedInverter?.name || '',
        batteryType: freeQuoteSelectedBattery?.name || '',
        installationCost: freeQuoteCalculatedCosts.installationLaborCost,
        equipmentCost: freeQuoteCalculatedCosts.totalEquipmentCost,
        totalCost: freeQuoteCalculatedCosts.totalSystemCost,
        paymentTerms: freeQuoteForm.paymentTerms,
        warrantyYears: parseInt(freeQuoteForm.warrantyYears) || 10,
        remarks: freeQuoteForm.remarks,
        includeIoTData: false,
        equipmentDetails: {
          panel: freeQuoteSelectedPanel,
          panelQuantity: freeQuotePanelQuantity,
          inverter: freeQuoteSelectedInverter,
          inverterQuantity: freeQuoteInverterQuantity,
          battery: freeQuoteSelectedBattery,
          batteryQuantity: freeQuoteBatteryQuantity,
          mountingStructure: freeQuoteSelectedMountingStructure,
          mountingStructureQuantity: freeQuoteMountingStructureQuantity,
          electricalComponents: freeQuoteSelectedElectricalComponents.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, price: item.price, total: item.total
          })),
          cables: freeQuoteSelectedCables.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, length: item.length, price: item.price, total: item.total
          })),
          junctionBoxes: freeQuoteSelectedJunctionBoxes.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, price: item.price, total: item.total
          })),
          disconnectSwitches: freeQuoteSelectedDisconnectSwitches.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, price: item.price, total: item.total
          })),
          meters: freeQuoteSelectedMeters.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, price: item.price, total: item.total
          })),
          additionalEquipment: freeQuoteAdditionalEquipment.map(item => ({
            name: item.name, quantity: item.quantity, price: item.price, total: item.total
          }))
        }
      } : {
        quotationNumber: quotationForm.quotationNumber,
        quotationExpiryDate: quotationForm.quotationExpiryDate,
        systemSize: parseFloat(quotationForm.systemSize),
        systemType: quotationForm.systemType,
        panelsNeeded: panelQuantity,
        panelType: selectedPanel?.name || '',
        inverterType: selectedInverter?.name || '',
        batteryType: selectedBattery?.name || '',
        installationCost: calculatedCosts.installationLaborCost,
        equipmentCost: calculatedCosts.totalEquipmentCost,
        totalCost: calculatedCosts.totalSystemCost,
        paymentTerms: quotationForm.paymentTerms,
        warrantyYears: parseInt(quotationForm.warrantyYears) || 10,
        includeIoTData: includeIoTData,
        iotData: includeIoTData ? iotDataForPDF : null,
        equipmentDetails: {
          panel: selectedPanel,
          panelQuantity: panelQuantity,
          inverter: selectedInverter,
          inverterQuantity: inverterQuantity,
          battery: selectedBattery,
          batteryQuantity: batteryQuantity,
          mountingStructure: selectedMountingStructure,
          mountingStructureQuantity: mountingStructureQuantity,
          electricalComponents: selectedElectricalComponents.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, price: item.price, total: item.total
          })),
          cables: selectedCables.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, length: item.length, price: item.price, total: item.total
          })),
          junctionBoxes: selectedJunctionBoxes.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, price: item.price, total: item.total
          })),
          disconnectSwitches: selectedDisconnectSwitches.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, price: item.price, total: item.total
          })),
          meters: selectedMeters.map(item => ({
            id: item.id, name: item.name, quantity: item.quantity, price: item.price, total: item.total
          })),
          additionalEquipment: additionalEquipment.map(item => ({
            name: item.name, quantity: item.quantity, price: item.price, total: item.total
          }))
        }
      };

      const response = await axios.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
      showToast('Quotation PDF generated and uploaded successfully!', 'success');

      if (isFreeQuote) {
        fetchFreeQuoteDetails(selectedItem._id);
      } else {
        fetchPreAssessmentDetails(selectedItem._id);
      }
    } catch (err) {
      console.error('Error generating PDF:', err);
      showToast(err.response?.data?.message || 'Failed to generate PDF', 'error');
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Utility functions
  const hasDeviceAssigned = (item) => {
    // Check if device exists
    const hasDevice = !!(item.iotDeviceId || item.assignedDevice || item.assignedDeviceId);

    if (!hasDevice) return false;

    // Check if device status is 'assigned'
    // Status could be in different places depending on your data structure
    const deviceStatus = item.iotDeviceId?.status ||
      item.assignedDevice?.status ||
      item.deviceStatus ||
      item.iotDeviceStatus;

    return hasDevice && deviceStatus === 'assigned';
  };
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount || 0);
  };

  const getFullAddress = (address) => {
    if (!address) return 'Address not specified';
    if (typeof address === 'object') {
      const parts = [
        address.houseOrBuilding, address.street, address.barangay,
        address.cityMunicipality, address.province, address.zipCode
      ].filter(part => part && part.trim());
      return parts.join(', ') || 'Address not specified';
    }
    return 'Address not specified';
  };

  const getSystemTypeLabel = (value) => {
    const type = SYSTEM_TYPES.find(t => t.value === value);
    return type ? type.label : 'Not specified';
  };

  const getStatusConfig = (item) => {
    if (item.type === 'free_quote') {
      return FREE_QUOTE_STATUS[item.status] || FREE_QUOTE_STATUS.pending;
    } else {
      return PRE_ASSESSMENT_STATUS[item.status] || PRE_ASSESSMENT_STATUS.pending_payment;
    }
  };

  const getTypeConfig = (type) => {
    return ASSESSMENT_TYPES[type] || ASSESSMENT_TYPES.free_quote;
  };

  // Modal handlers
  const openDeployConfirmModal = () => {
    setShowDeployConfirmModal(true);
  };

  const closeDeployConfirmModal = () => {
    setShowDeployConfirmModal(false);
  };

  const openReportConfirmModal = () => {
    setShowReportConfirmModal(true);
  };

  const closeReportConfirmModal = () => {
    setShowReportConfirmModal(false);
  };

  // Event handlers
  const handleSelectItem = (item) => {
    if (item.type === 'free_quote') {
      fetchFreeQuoteDetails(item.id);
    } else {
      fetchPreAssessmentDetails(item.id);
    }
    setActiveTab('overview');
  };

  const handleBackToList = () => {
    setSelectedItem(null);
    setSelectedType(null);
    fetchAllAssessments();
  };

  const handleFreeQuoteFormChange = (field, value) => {
    setFreeQuoteForm(prev => ({ ...prev, [field]: value }));
  };

  const handleAssessmentFormChange = (field, value) => {
    setAssessmentForm(prev => ({ ...prev, [field]: value }));
  };

  const handleQuotationChange = (field, value) => {
    setQuotationForm(prev => ({ ...prev, [field]: value }));
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    files.forEach(file => formData.append('images', file));

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/upload-images`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setSiteImages(prev => [...prev, ...response.data.images]);
        showToast(`${response.data.images.length} image(s) uploaded successfully!`, 'success');
        fetchPreAssessmentDetails(selectedItem._id);
      } else {
        showToast(response.data.message || 'Failed to upload images', 'error');
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      showToast(err.response?.data?.message || 'Failed to upload images', 'error');
    } finally {
      setUploading(false);
      setShowImageUploader(false);
      e.target.value = '';
    }
  };

  const validateAssessmentForm = () => {
    const requiredFields = [
      { field: assessmentForm.roofCondition, name: 'Roof Condition' },
      { field: assessmentForm.roofLength, name: 'Roof Length' },
      { field: assessmentForm.roofWidth, name: 'Roof Width' },
      { field: assessmentForm.structuralIntegrity, name: 'Structural Integrity' },
      { field: assessmentForm.estimatedInstallationTime, name: 'Estimated Installation Time' },
      { field: assessmentForm.recommendations, name: 'Engineer Recommendations' },
      { field: assessmentForm.technicalFindings, name: 'Technical Findings' },
      { field: assessmentForm.siteVisitNotes, name: 'Site Visit Notes' }
    ];

    const missingFields = requiredFields.filter(item => !item.field || item.field === '' || item.field === 0);
    if (missingFields.length > 0) {
      const fieldNames = missingFields.map(item => item.name).join(', ');
      showToast(`Please fill in all required fields: ${fieldNames}`, 'warning');
      return false;
    }
    return true;
  };

  const saveSiteAssessment = async () => {
    if (!validateAssessmentForm()) return;
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/update-assessment`,
        assessmentForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Site assessment saved successfully', 'success');
      fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      console.error('Error saving assessment:', err);
      showToast('Failed to save assessment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const deployDevice = async () => {
    // Add this check at the beginning
    if (!hasDeviceAssigned(selectedItem)) {
      showToast('Cannot deploy: No device assigned or device is not in assigned status', 'error');
      return;
    }

    if (!deployNotes || deployNotes.trim() === '') {
      showToast('Please enter deployment notes before deploying the device', 'warning');
      return;
    }

    setSubmitting(true);
    setShowDeployConfirmModal(false);

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/deploy-device`,
        { notes: deployNotes },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast(response.data.message || 'Device deployed successfully. Data collection started!', 'success');
      setDeployNotes('');
      fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      console.error('Error deploying device:', err);
      showToast(err.response?.data?.message || 'Failed to deploy device', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const submitFinalReport = async () => {
    setSubmitting(true);
    setShowReportConfirmModal(false);

    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/submit-report`,
        {
          finalSystemSize: quotationForm.systemSize,
          finalSystemCost: calculatedCosts.totalSystemCost,
          recommendedSystemType: quotationForm.systemType,
          panelsNeeded: panelQuantity,
          estimatedAnnualProduction: (quotationForm.systemSize || 0) * 1200,
          estimatedAnnualSavings: (calculatedCosts.totalSystemCost || 0) * 0.15,
          paybackPeriod: Math.ceil((calculatedCosts.totalSystemCost || 0) / ((quotationForm.systemSize || 1) * 1200 * 0.1)),
          co2Offset: (quotationForm.systemSize || 0) * 800,
          engineerRecommendations: assessmentForm.recommendations,
          technicalFindings: assessmentForm.technicalFindings,
          equipmentBreakdown: { panel: selectedPanel, panelQuantity, inverter: selectedInverter, inverterQuantity, battery: selectedBattery, batteryQuantity, additionalEquipment }
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast('Final report submitted successfully', 'success');
      fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      console.error('Error submitting report:', err);
      showToast('Failed to submit report', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const addComment = async () => {
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/add-comment`,
        { comment: commentText, isPublic: true },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText('');
      showToast('Comment added successfully', 'success');
      fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      console.error('Error adding comment:', err);
      showToast('Failed to add comment', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // useEffect hooks
  useEffect(() => {
    fetchAllAssessments();
    fetchSystemConfig();
  }, []);

  useEffect(() => {
    let filtered = [...allAssessments];
    if (searchTerm) {
      filtered = filtered.filter(item => {
        const name = `${item.clientName || ''} ${item.clientLastName || ''}`.toLowerCase();
        const ref = (item.bookingReference || item.quotationReference || '').toLowerCase();
        return name.includes(searchTerm.toLowerCase()) || ref.includes(searchTerm.toLowerCase());
      });
    }
    if (activeTypeFilter !== 'all') filtered = filtered.filter(item => item.type === activeTypeFilter);
    if (activeStatusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const status = item.type === 'free_quote' ? item.status : item.assessmentStatus;
        return status === activeStatusFilter;
      });
    }
    setFilteredAssessments(filtered);
  }, [allAssessments, searchTerm, activeTypeFilter, activeStatusFilter]);

  useEffect(() => {
    const total = (quotationForm.installationCost || 0) + (quotationForm.equipmentCost || 0);
    setQuotationForm(prev => ({ ...prev, totalCost: total }));
  }, [quotationForm.installationCost, quotationForm.equipmentCost]);

  useEffect(() => {
    const total = (freeQuoteForm.installationCost || 0) + (freeQuoteForm.equipmentCost || 0);
    setFreeQuoteForm(prev => ({ ...prev, totalCost: total }));
  }, [freeQuoteForm.installationCost, freeQuoteForm.equipmentCost]);

  useEffect(() => {
    if (selectedType === 'pre_assessment') {
      calculateTotalCosts();
    }
  }, [
    selectedPanel, selectedInverter, selectedBattery, selectedMountingStructure,
    panelQuantity, inverterQuantity, batteryQuantity, mountingStructureQuantity,
    selectedElectricalComponents, selectedCables, selectedJunctionBoxes,
    selectedDisconnectSwitches, selectedMeters, additionalEquipment,
    quotationForm.systemSize, config
  ]);

  useEffect(() => {
    if (selectedType === 'free_quote') {
      freeQuoteCalculateTotalCosts();
    }
  }, [
    freeQuoteSelectedPanel, freeQuoteSelectedInverter, freeQuoteSelectedBattery,
    freeQuoteSelectedMountingStructure, freeQuotePanelQuantity, freeQuoteInverterQuantity,
    freeQuoteBatteryQuantity, freeQuoteMountingStructureQuantity,
    freeQuoteSelectedElectricalComponents, freeQuoteSelectedCables,
    freeQuoteSelectedJunctionBoxes, freeQuoteSelectedDisconnectSwitches,
    freeQuoteSelectedMeters, freeQuoteAdditionalEquipment,
    freeQuoteForm.systemSize, config
  ]);

  // Skeleton Loader Components
  const SkeletonCard = () => (
    <div className="assessment-card-enad skeleton-card-enad">
      <div className="card-content-enad">
        <div className="card-header-enad">
          <div className="skeleton-badge-enad"></div>
          <div className="skeleton-badge-enad"></div>
        </div>
        <div className="skeleton-line-enad medium-enad"></div>
        <div className="skeleton-line-enad small-enad"></div>
        <div className="card-details-enad">
          <div className="skeleton-line-enad tiny-enad"></div>
          <div className="skeleton-line-enad tiny-enad"></div>
          <div className="skeleton-line-enad tiny-enad"></div>
        </div>
        <div className="card-footer-enad">
          <div className="skeleton-button-enad small-enad"></div>
        </div>
      </div>
    </div>
  );

  const SkeletonList = () => (
    <div className="my-assessments-enad">
      <div className="assessments-header-enad">
        <div className="skeleton-line-enad large-enad"></div>
        <div className="skeleton-line-enad medium-enad"></div>
      </div>
      <div className="search-filters-enad">
        <div className="skeleton-search-enad"></div>
        <div className="filter-tabs-enad">
          <div className="skeleton-tab-enad"></div>
          <div className="skeleton-tab-enad"></div>
          <div className="skeleton-tab-enad"></div>
        </div>
        <div className="filter-tabs-enad">
          <div className="skeleton-tab-enad"></div>
          <div className="skeleton-tab-enad"></div>
          <div className="skeleton-tab-enad"></div>
          <div className="skeleton-tab-enad"></div>
        </div>
      </div>
      <div className="assessments-grid-enad">
        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  if (loading && allAssessments.length === 0) {
    return <SkeletonList />;
  }

  // Get unique statuses for filter tabs
  const getUniqueStatuses = () => {
    const statuses = new Set();
    filteredAssessments.forEach(item => {
      const status = item.type === 'free_quote' ? item.status : item.assessmentStatus;
      if (status) statuses.add(status);
    });
    return Array.from(statuses);
  };

  // Assessment List View
  if (!selectedItem) {
    const uniqueStatuses = getUniqueStatuses();

    return (
      <>
        <Helmet><title>My Assessments | Engineer | SOLARIS</title></Helmet>
        <div className="my-assessments-enad">
          <div className="assessments-header-enad">
            <h1>My Assessments</h1>
            <p>Manage free quotes and site assessments assigned to you</p>
          </div>

          {/* Search Bar */}
          <div className="search-bar-enad">
            <input
              type="text"
              placeholder="Search by reference or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="assessment-search-input-enad"
            />
          </div>

          {/* Type Filter Tabs */}
          <div className="filter-tabs-enad">
            <button
              className={`filter-tab-enad ${activeTypeFilter === 'all' ? 'active-enad' : ''}`}
              onClick={() => setActiveTypeFilter('all')}
            >
              All
            </button>
            <button
              className={`filter-tab-enad ${activeTypeFilter === 'free_quote' ? 'active-enad' : ''}`}
              onClick={() => setActiveTypeFilter('free_quote')}
            >
              Free Quotes
            </button>
            <button
              className={`filter-tab-enad ${activeTypeFilter === 'pre_assessment' ? 'active-enad' : ''}`}
              onClick={() => setActiveTypeFilter('pre_assessment')}
            >
              Pre-Assessments
            </button>
          </div>

          {/* Status Filter Tabs */}
          {uniqueStatuses.length > 0 && (
            <div className="filter-tabs-enad status-tabs-enad">
              <button
                className={`filter-tab-enad ${activeStatusFilter === 'all' ? 'active-enad' : ''}`}
                onClick={() => setActiveStatusFilter('all')}
              >
                All Status
              </button>
              {uniqueStatuses.map(status => {
                const statusConfig = PRE_ASSESSMENT_STATUS[status] || FREE_QUOTE_STATUS[status] || { label: status?.replace(/_/g, ' ') };
                return (
                  <button
                    key={status}
                    className={`filter-tab-enad ${activeStatusFilter === status ? 'active-enad' : ''}`}
                    onClick={() => setActiveStatusFilter(status)}
                  >
                    {statusConfig.label}
                  </button>
                );
              })}
            </div>
          )}

          {error && <div className="error-container-enad"><span>{error}</span></div>}

          {filteredAssessments.length === 0 ? (
            <div className="empty-state-enad">
              <h3>No assessments found</h3>
              <p>{allAssessments.length === 0 ? "You don't have any assessments assigned yet." : "No assessments match your search criteria."}</p>
            </div>
          ) : (
            <div className="assessments-grid-enad">
              {filteredAssessments.map((item) => {
                const StatusConfig = getStatusConfig(item);
                const TypeConfig = getTypeConfig(item.type);
                return (
                  <div key={`${item.type}-${item.id}`} className="assessment-card-enad" onClick={() => handleSelectItem(item)}>
                    <div className="card-content-enad">
                      <div className="card-header-enad">
                        <div className={`type-badge-enad ${TypeConfig.color}`}>{TypeConfig.label}</div>
                        <div className={`status-badge-enad ${StatusConfig.color}`}>{StatusConfig.label}</div>
                      </div>
                      <h3 className="client-name-enad">{item.clientName} {item.clientLastName}</h3>
                      <p className="reference-enad">Ref: {item.bookingReference || item.quotationReference}</p>
                      <div className="card-details-enad">
                        <div className="detail-item-enad"><span className="truncate">Address: {getFullAddress(item.address)}</span></div>
                        <div className="detail-item-enad">Requested: {formatDate(item.preferredDate || item.requestedAt)}</div>
                        <div className="detail-item-enad">Property: <span className="capitalize">{item.propertyType || 'N/A'}</span></div>
                        {item.systemType && <div className="detail-item-enad">System: {getSystemTypeLabel(item.systemType)}</div>}
                        {(item.roofLength || item.roofWidth) && <div className="detail-item-enad">Roof: {item.roofLength || '?'}m x {item.roofWidth || '?'}m</div>}
                        {item.type === 'free_quote' && item.monthlyBill && <div className="detail-item-enad">Monthly Bill: {formatCurrency(item.monthlyBill)}</div>}
                        {item.type === 'pre_assessment' && hasDeviceAssigned(item) && <div className="detail-item-enad"><span className="badge-small-enad">Device Assigned</span></div>}
                        {item.type === 'pre_assessment' && item.dataCollectionStart && <div className="detail-item-enad">Data Collection: {formatDate(item.dataCollectionStart)} - {formatDate(item.dataCollectionEnd) || 'Ongoing'}</div>}
                      </div>
                      <div className="card-footer-enad">
                        <div className="card-badges-enad">
                          {item.type === 'pre_assessment' && item.sitePhotos?.length > 0 && <span className="badge-small-enad photos-enad">{item.sitePhotos.length} Photos</span>}
                          {item.type === 'pre_assessment' && item.totalReadings > 0 && <span className="badge-small-enad data-enad">{item.totalReadings} Readings</span>}
                          {item.type === 'free_quote' && item.quotationFile && <span className="badge-small-enad quotation-enad">Quotation Ready</span>}
                        </div>
                        <button className="view-link-enad">View Details →</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </>
    );
  }

  // Detail View for Free Quote
  if (selectedType === 'free_quote') {
    const StatusConfig = getStatusConfig(selectedItem);
    const TypeConfig = getTypeConfig('free_quote');

    return (
      <>
        <Helmet><title>Free Quote Details | Engineer | SOLARIS</title></Helmet>
        <div className="my-assessments-enad">
          <div className="detail-view-enad">
            <div className="detail-content-enad">
              <button onClick={handleBackToList} className="back-button-enad">← Back to Assessments</button>
              <div className="detail-header-enad">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`type-badge-enad ${TypeConfig.color}`}>{TypeConfig.label}</span>
                    <h1 className="detail-title-enad">{selectedItem.quotationReference}</h1>
                  </div>
                  <div className="client-meta-enad">
                    <div className="client-meta-item-enad">{selectedItem.clientName} {selectedItem.clientLastName}</div>
                    <div className="client-meta-item-enad">{selectedItem.clientEmail || 'No email'}</div>
                    <div className="client-meta-item-enad">{selectedItem.clientPhone || 'No contact'}</div>
                    <div className="client-meta-item-enad"><span className="capitalize">{selectedItem.clientType || 'Residential'}</span></div>
                  </div>
                </div>
                <div className={`status-badge-enad ${StatusConfig.color}`}>{StatusConfig.label}</div>
              </div>
              <div className="info-grid-enad">
                <div className="info-item-enad"><span className="info-label-enad">Monthly Bill</span><span className="info-value-enad">{formatCurrency(selectedItem.monthlyBill)}</span></div>
                <div className="info-item-enad"><span className="info-label-enad">Property Type</span><span className="info-value-enad capitalize">{selectedItem.propertyType}</span></div>
                <div className="info-item-enad"><span className="info-label-enad">Desired Capacity</span><span className="info-value-enad">{selectedItem.desiredCapacity || 'Not specified'}</span></div>
                {selectedItem.systemType && <div className="info-item-enad"><span className="info-label-enad">Preferred System Type</span><span className="info-value-enad">{getSystemTypeLabel(selectedItem.systemType)}</span></div>}
                <div className="info-item-enad"><span className="info-label-enad">Requested Date</span><span className="info-value-enad">{formatDate(selectedItem.requestedAt)}</span></div>
                <div className="info-item-enad info-full-width-enad"><span className="info-label-enad">Address</span><span className="info-value-enad">{getFullAddress(selectedItem.address)}</span></div>
              </div>
              <div className="detail-section-enad">
                <h3 className="detail-section-title-enad">Equipment Selection and Quotation</h3>

                {/* Basic Information */}
                <div className="quotation-section">
                  <h4>Basic Information</h4>
                  <div className="form-grid-enad">
                    <div className="form-group-enad">
                      <label className="form-label-enad">Quotation Number</label>
                      <input type="text" className="assessment-form-input-enad" value={freeQuoteForm.quotationNumber} onChange={(e) => handleFreeQuoteFormChange('quotationNumber', e.target.value)} />
                    </div>
                    <div className="form-group-enad">
                      <label className="form-label-enad">Expiry Date (30 Days Auto)</label>
                      <input
                        type="date"
                        className="assessment-form-input-enad"
                        value={freeQuoteForm.quotationExpiryDate}
                        onChange={(e) => handleFreeQuoteFormChange('quotationExpiryDate', e.target.value)}
                      />
                      <small className="form-hint-enad">Automatically set to 30 days from today</small>
                    </div>
                    <div className="form-group-enad">
                      <label className="form-label-enad">System Type</label>
                      <select className="assessment-form-select-enad" value={freeQuoteForm.systemType} onChange={(e) => handleFreeQuoteFormChange('systemType', e.target.value)}>
                        {SYSTEM_TYPES.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad">
                      <label className="form-label-enad">System Size (kWp) *</label>
                      <input type="number" step="0.5" className="assessment-form-input-enad" value={freeQuoteForm.systemSize} onChange={(e) => handleFreeQuoteFormChange('systemSize', parseFloat(e.target.value))} placeholder="e.g., 5.0" />
                    </div>
                  </div>
                </div>

                {/* Solar Panels */}
                <div className="quotation-section">
                  <h4>Solar Panels</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select className="assessment-form-select-enad" value={freeQuoteSelectedPanel?._id || ''} onChange={(e) => { const panel = availablePanels.find(p => p._id === e.target.value); setFreeQuoteSelectedPanel(panel); if (panel && panel.unit === 'watt') setFreeQuotePanelQuantity(1); }}>
                        <option value="">-- Select Panel --</option>
                        {availablePanels.filter(p => p.isActive).map(panel => (<option key={panel._id} value={panel._id}>{panel.name} - {panel.brand} - ₱{panel.price.toLocaleString()}/{panel.unit}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <input type="number" min="1" className="assessment-form-input-enad" value={freeQuotePanelQuantity} onChange={(e) => setFreeQuotePanelQuantity(parseInt(e.target.value) || 0)} disabled={freeQuoteSelectedPanel?.unit === 'watt'} />
                    </div>
                    <div className="cost-display"><span>{formatCurrency(freeQuoteCalculatedCosts.panelCost)}</span></div>
                  </div>
                  {freeQuoteSelectedPanel?.unit === 'watt' && <small className="form-hint-enad">Price is per watt. Total calculated based on system size: {freeQuoteForm.systemSize} kWp</small>}
                </div>

                {/* Inverters */}
                <div className="quotation-section">
                  <h4>Inverters</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select className="assessment-form-select-enad" value={freeQuoteSelectedInverter?._id || ''} onChange={(e) => { const inverter = availableInverters.find(i => i._id === e.target.value); setFreeQuoteSelectedInverter(inverter); }}>
                        <option value="">-- Select Inverter --</option>
                        {availableInverters.filter(i => i.isActive).map(inverter => (<option key={inverter._id} value={inverter._id}>{inverter.name} - {inverter.brand} - ₱{inverter.price.toLocaleString()}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <input type="number" min="1" className="assessment-form-input-enad" value={freeQuoteInverterQuantity} onChange={(e) => setFreeQuoteInverterQuantity(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="cost-display"><span>{formatCurrency(freeQuoteCalculatedCosts.inverterCost)}</span></div>
                  </div>
                </div>

                {/* Batteries */}
                <div className="quotation-section">
                  <h4>Batteries (Optional)</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select className="assessment-form-select-enad" value={freeQuoteSelectedBattery?._id || ''} onChange={(e) => { const battery = availableBatteries.find(b => b._id === e.target.value); setFreeQuoteSelectedBattery(battery); }}>
                        <option value="">-- No Battery --</option>
                        {availableBatteries.filter(b => b.isActive).map(battery => (<option key={battery._id} value={battery._id}>{battery.name} - {battery.brand} - ₱{battery.price.toLocaleString()}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <input type="number" min="0" className="assessment-form-input-enad" value={freeQuoteBatteryQuantity} onChange={(e) => setFreeQuoteBatteryQuantity(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="cost-display"><span>{formatCurrency(freeQuoteCalculatedCosts.batteryCost)}</span></div>
                  </div>
                </div>

                {/* Mounting Structure */}
                <div className="quotation-section">
                  <h4>Mounting Structure</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select className="assessment-form-select-enad" value={freeQuoteSelectedMountingStructure?._id || ''} onChange={(e) => { const structure = availableMountingStructures.find(m => m._id === e.target.value); setFreeQuoteSelectedMountingStructure(structure); }}>
                        <option value="">-- Select Mounting Structure --</option>
                        {availableMountingStructures.filter(m => m.isActive).map(structure => (<option key={structure._id} value={structure._id}>{structure.name} - {structure.brand} - ₱{structure.price.toLocaleString()}/{structure.unit}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <input type="number" min="1" className="assessment-form-input-enad" value={freeQuoteMountingStructureQuantity} onChange={(e) => setFreeQuoteMountingStructureQuantity(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="cost-display"><span>{formatCurrency(freeQuoteCalculatedCosts.mountingCost)}</span></div>
                  </div>
                </div>

                {/* Electrical Components */}
                <div className="quotation-section">
                  <h4>Electrical Components</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddElectricalComponent}>+ Add Component</button>
                  {freeQuoteSelectedElectricalComponents.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => freeQuoteUpdateElectricalComponent(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Component --</option>
                        {availableElectricalComponents.filter(c => c.isActive).map(comp => (<option key={comp._id} value={comp._id}>{comp.name} - ₱{comp.price.toLocaleString()}</option>))}
                      </select>
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateElectricalComponent(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveElectricalComponent(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Cables */}
                <div className="quotation-section">
                  <h4>Cables and Wiring</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddCable}>+ Add Cable</button>
                  {freeQuoteSelectedCables.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => freeQuoteUpdateCable(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Cable Type --</option>
                        {availableCables.filter(c => c.isActive).map(cable => (<option key={cable._id} value={cable._id}>{cable.name} - ₱{cable.price.toLocaleString()}/{cable.unit}</option>))}
                      </select>
                      <input type="number" placeholder="Length (m)" className="assessment-form-input-enad" value={item.length} onChange={(e) => freeQuoteUpdateCable(index, 'length', parseFloat(e.target.value) || 0)} style={{ width: '100px' }} />
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateCable(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveCable(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Junction Boxes */}
                <div className="quotation-section">
                  <h4>Junction Boxes</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddJunctionBox}>+ Add Junction Box</button>
                  {freeQuoteSelectedJunctionBoxes.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => freeQuoteUpdateJunctionBox(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Junction Box --</option>
                        {availableJunctionBoxes.filter(j => j.isActive).map(box => (<option key={box._id} value={box._id}>{box.name} - ₱{box.price.toLocaleString()}</option>))}
                      </select>
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateJunctionBox(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveJunctionBox(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Disconnect Switches */}
                <div className="quotation-section">
                  <h4>Disconnect Switches</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddDisconnectSwitch}>+ Add Switch</button>
                  {freeQuoteSelectedDisconnectSwitches.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => freeQuoteUpdateDisconnectSwitch(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Switch --</option>
                        {availableDisconnectSwitches.filter(s => s.isActive).map(sw => (<option key={sw._id} value={sw._id}>{sw.name} - ₱{sw.price.toLocaleString()}</option>))}
                      </select>
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateDisconnectSwitch(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveDisconnectSwitch(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Meters */}
                <div className="quotation-section">
                  <h4>Meters</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddMeter}>+ Add Meter</button>
                  {freeQuoteSelectedMeters.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => freeQuoteUpdateMeter(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Meter --</option>
                        {availableMeters.filter(m => m.isActive).map(meter => (<option key={meter._id} value={meter._id}>{meter.name} - ₱{meter.price.toLocaleString()}</option>))}
                      </select>
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateMeter(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveMeter(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Additional Equipment */}
                <div className="quotation-section">
                  <h4>Additional Equipment</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddAdditionalEquipment}>+ Add Custom Item</button>
                  {freeQuoteAdditionalEquipment.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <input type="text" placeholder="Item name" className="assessment-form-input-enad" value={item.name} onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'name', e.target.value)} style={{ flex: 2 }} />
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <input type="number" placeholder="Price" className="assessment-form-input-enad" value={item.price} onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'price', parseFloat(e.target.value) || 0)} style={{ width: '120px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveAdditionalEquipment(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Installation Labor */}
                <div className="quotation-section">
                  <h4>Installation Labor</h4>

                  {/* Labor Cost Percentage Input */}
                  <div className="labor-percentage-control" style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                          Labor Cost (%)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          className="assessment-form-input-enad"
                          value={laborCostPercentage}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setLaborCostPercentage(Math.min(100, Math.max(0, value)));
                            setTimeout(() => calculateTotalCosts(), 0);
                          }}
                          style={{ width: '100px' }}
                        />
                        <small className="form-hint-enad">Default: 20% of total equipment cost</small>
                      </div>
                    </div>
                  </div>

                  {/* Labor Cost Display */}
                  <div className="labor-calculation">
                    <div className="labor-detail">
                      <span>Total Equipment Cost:</span>
                      <span>{formatCurrency(calculatedCosts.totalEquipmentCost)}</span>
                    </div>
                    <div className="labor-detail">
                      <span>Labor Cost ({laborCostPercentage}%):</span>
                      <span>{formatCurrency(calculatedCosts.installationLaborCost)}</span>
                    </div>
                    <div className="labor-total">
                      <strong>Subtotal (Equipment + Labor)</strong>
                      <strong>{formatCurrency(calculatedCosts.subtotalCost)}</strong>
                    </div>
                  </div>
                </div>

                {/* Overhead & Contingency */}
                <div className="quotation-section">
                  <h4>Overhead & Contingency</h4>
                  <div className="cost-percentage-control" style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Overhead & Contingency (% of Subtotal)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        className="assessment-form-input-enad"
                        value={overheadContingencyPercentage}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setOverheadContingencyPercentage(Math.min(100, Math.max(0, value)));
                          setTimeout(() => calculateTotalCosts(), 0);
                        }}
                        style={{ width: '100px' }}
                      />
                      <small className="form-hint-enad">Default: 15% of subtotal (Equipment + Labor)</small>
                    </div>
                  </div>
                  <div className="cost-calculation">
                    <div className="cost-detail">
                      <span>Subtotal (Equipment + Labor):</span>
                      <span>{formatCurrency(calculatedCosts.subtotalCost)}</span>
                    </div>
                    <div className="cost-detail">
                      <span>Overhead & Contingency ({overheadContingencyPercentage}%):</span>
                      <span>{formatCurrency(calculatedCosts.overheadContingencyCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Contractor Profit */}
                <div className="quotation-section">
                  <h4>Contractor Profit</h4>
                  <div className="cost-percentage-control" style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Contractor Profit (% of Subtotal)
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        className="assessment-form-input-enad"
                        value={contractorProfitPercentage}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setContractorProfitPercentage(Math.min(100, Math.max(0, value)));
                          setTimeout(() => calculateTotalCosts(), 0);
                        }}
                        style={{ width: '100px' }}
                      />
                      <small className="form-hint-enad">Default: 10% of subtotal (Equipment + Labor)</small>
                    </div>
                  </div>
                  <div className="cost-calculation">
                    <div className="cost-detail">
                      <span>Subtotal (Equipment + Labor):</span>
                      <span>{formatCurrency(calculatedCosts.subtotalCost)}</span>
                    </div>
                    <div className="cost-detail">
                      <span>Contractor Profit ({contractorProfitPercentage}%):</span>
                      <span>{formatCurrency(calculatedCosts.contractorProfitCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Complete Cost Summary */}
                <div className="cost-summary-large">
                  <h3>Complete Cost Summary</h3>
                  <div className="summary-row"><span>Solar Panels:</span><span>{formatCurrency(calculatedCosts.panelCost)}</span></div>
                  <div className="summary-row"><span>Inverters:</span><span>{formatCurrency(calculatedCosts.inverterCost)}</span></div>
                  <div className="summary-row"><span>Batteries:</span><span>{formatCurrency(calculatedCosts.batteryCost)}</span></div>
                  <div className="summary-row"><span>Mounting Structure:</span><span>{formatCurrency(calculatedCosts.mountingCost)}</span></div>
                  <div className="summary-row"><span>Electrical Components:</span><span>{formatCurrency(calculatedCosts.electricalCost)}</span></div>
                  <div className="summary-row"><span>Cables and Wiring:</span><span>{formatCurrency(calculatedCosts.cableCost)}</span></div>
                  <div className="summary-row"><span>Junction Boxes:</span><span>{formatCurrency(calculatedCosts.junctionBoxCost)}</span></div>
                  <div className="summary-row"><span>Disconnect Switches:</span><span>{formatCurrency(calculatedCosts.disconnectSwitchCost)}</span></div>
                  <div className="summary-row"><span>Meters:</span><span>{formatCurrency(calculatedCosts.meterCost)}</span></div>
                  <div className="summary-row"><span>Additional Equipment:</span><span>{formatCurrency(calculatedCosts.additionalCost)}</span></div>
                  <div className="summary-row"><span>Equipment Total:</span><span>{formatCurrency(calculatedCosts.totalEquipmentCost)}</span></div>
                  <div className="summary-row"><span>Installation Labor ({laborCostPercentage}%):</span><span>{formatCurrency(calculatedCosts.installationLaborCost)}</span></div>
                  <div className="summary-row"><span>Subtotal (Equipment + Labor):</span><span>{formatCurrency(calculatedCosts.subtotalCost)}</span></div>
                  <div className="summary-row"><span>Overhead & Contingency ({overheadContingencyPercentage}%):</span><span>{formatCurrency(calculatedCosts.overheadContingencyCost)}</span></div>
                  <div className="summary-row"><span>Contractor Profit ({contractorProfitPercentage}%):</span><span>{formatCurrency(calculatedCosts.contractorProfitCost)}</span></div>
                  <div className="summary-row total"><span>TOTAL SYSTEM COST:</span><span>{formatCurrency(calculatedCosts.totalSystemCost)}</span></div>
                </div>

                {/* Payment Terms & Remarks */}
                <div className="form-group-enad">
                  <label className="form-label-enad">Payment Terms</label>
                  <textarea className="assessment-form-textarea-enad" value={freeQuoteForm.paymentTerms} onChange={(e) => handleFreeQuoteFormChange('paymentTerms', e.target.value)} rows={2} placeholder="e.g., 30% down payment, 70% upon completion" />
                </div>
                <div className="form-group-enad">
                  <label className="form-label-enad">Remarks</label>
                  <textarea className="assessment-form-textarea-enad" value={freeQuoteForm.remarks} onChange={(e) => handleFreeQuoteFormChange('remarks', e.target.value)} rows={2} placeholder="Additional notes or special instructions" />
                </div>

                <div className="action-buttons-enad" style={{ marginTop: '20px' }}>
                  <button onClick={generateQuotationPDF} disabled={generatingPDF || !freeQuoteForm.systemSize || freeQuoteCalculatedCosts.totalSystemCost === 0} className="btn-primary-enad">
                    {generatingPDF ? 'Generating...' : 'Generate and Upload PDF'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // Detail View for Pre-Assessment
  const StatusConfig = getStatusConfig(selectedItem);
  const TypeConfig = getTypeConfig('pre_assessment');
  const deviceAssigned = hasDeviceAssigned(selectedItem);

  return (
    <>
      <Helmet><title>Pre-Assessment Details | Engineer | SOLARIS</title></Helmet>
      <div className="my-assessments-enad">
        <div className="detail-view-enad">
          <div className="detail-content-enad">
            <button onClick={handleBackToList} className="back-button-enad">← Back to Assessments</button>
            <div className="detail-header-enad">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`type-badge-enad ${TypeConfig.color}`}>{TypeConfig.label}</span>
                  <h1 className="detail-title-enad">{selectedItem.bookingReference}</h1>
                </div>
                <div className="client-meta-enad">
                  <div className="client-meta-item-enad">{selectedItem.clientName} {selectedItem.clientLastName}</div>
                  <div className="client-meta-item-enad">{selectedItem.clientEmail || 'No email'}</div>
                  <div className="client-meta-item-enad">{selectedItem.clientPhone || 'No contact'}</div>
                  <div className="client-meta-item-enad"><span className="capitalize">{selectedItem.clientType || 'Residential'}</span></div>
                </div>
              </div>
              <div className={`status-badge-enad ${StatusConfig.color}`}>{StatusConfig.label}</div>
            </div>

            <div className="tabs-enad">
              {['overview', 'site-inspection', 'quotation', 'documents', 'comments'].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)} className={`tab-btn-enad ${activeTab === tab ? 'active-enad' : ''}`}>
                  {tab === 'overview' && 'Overview'}{tab === 'site-inspection' && 'Site Inspection'}{tab === 'quotation' && 'Quotation'}{tab === 'documents' && 'Documents'}{tab === 'comments' && 'Comments'}
                </button>
              ))}
            </div>

            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div>
                <div className="info-grid-enad">
                  <div className="info-item-enad"><span className="info-label-enad">Address</span><span className="info-value-enad">{getFullAddress(selectedItem.address)}</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Property Type</span><span className="info-value-enad capitalize">{selectedItem.propertyType}</span></div>
                  {selectedItem.systemType && <div className="info-item-enad"><span className="info-label-enad">Preferred System Type</span><span className="info-value-enad">{getSystemTypeLabel(selectedItem.systemType)}</span></div>}
                  <div className="info-item-enad"><span className="info-label-enad">Roof Type</span><span className="info-value-enad capitalize">{selectedItem.roofType || 'Not specified'}</span></div>
                  {(selectedItem.roofLength || selectedItem.roofWidth) && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Roof Dimensions</span>
                      <span className="info-value-enad">
                        {selectedItem.roofLength ? `${selectedItem.roofLength}m` : '?'} × {selectedItem.roofWidth ? `${selectedItem.roofWidth}m` : '?'}
                        {calculateRoofArea(selectedItem.roofLength, selectedItem.roofWidth) && (
                          <span style={{ display: 'block', fontSize: '12px', color: '#000000' }}>
                            ({calculateRoofArea(selectedItem.roofLength, selectedItem.roofWidth)} m²)
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  <div className="info-item-enad"><span className="info-label-enad">Desired Capacity</span><span className="info-value-enad">{selectedItem.desiredCapacity || 'Not specified'}</span></div>

                  <div className="info-item-enad"><span className="info-label-enad">Monthly Bill</span><span className="info-value-enad">{formatCurrency(selectedItem.monthlyBill || 0)}</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Monthly Consumption</span><span className="info-value-enad">{selectedItem.consumption || 0} kWh</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Rate per kWh</span><span className="info-value-enad">₱{(selectedItem.rate || 0).toFixed(2)}</span></div>
                  <div className="info-item-enad">
                    <span className="info-label-enad">Day Consumption</span>
                    <span className="info-value-enad">{selectedItem.dayConsumption?.toFixed(2) || 0} kWh</span>
                  </div>
                  <div className="info-item-enad">
                    <span className="info-label-enad">Night Consumption</span>
                    <span className="info-value-enad">{selectedItem.nightConsumption?.toFixed(2) || 0} kWh</span>
                  </div>
                  <div className="info-item-enad"><span className="info-label-enad">Day/Night Usage</span><span className="info-value-enad">{selectedItem.dayPercentage || 0}% / {selectedItem.nightPercentage || 0}%</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Total Daily Consumption</span><span className="info-value-enad">{selectedItem.totalDailyConsumption || 0} kWh/day</span></div>
                  {selectedItem.targetSavings && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Target Savings</span>
                      <span className="info-value-enad">{selectedItem.targetSavings}%</span>
                    </div>
                  )}

                  <div className="info-item-enad"><span className="info-label-enad">Booked Date</span><span className="info-value-enad">{formatDate(selectedItem.bookedAt)}</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Preferred Date</span><span className="info-value-enad">{formatDate(selectedItem.preferredDate)}</span></div>
                  {selectedItem.siteVisitDate && <div className="info-item-enad"><span className="info-label-enad">Site Visit Date</span><span className="info-value-enad">{formatDate(selectedItem.siteVisitDate)}</span></div>}
                  {selectedItem.deviceDeployedAt && <div className="info-item-enad"><span className="info-label-enad">Device Deployed</span><span className="info-value-enad">{formatDateTime(selectedItem.deviceDeployedAt)}</span></div>}
                  {selectedItem.dataCollectionStart && <div className="info-item-enad"><span className="info-label-enad">Data Collection Start</span><span className="info-value-enad">{formatDateTime(selectedItem.dataCollectionStart)}</span></div>}
                  {selectedItem.dataCollectionEnd && <div className="info-item-enad"><span className="info-label-enad">Data Collection End</span><span className="info-value-enad">{formatDateTime(selectedItem.dataCollectionEnd)}</span></div>}
                  {selectedItem.totalReadings > 0 && <div className="info-item-enad"><span className="info-label-enad">Total Readings</span><span className="info-value-enad">{selectedItem.totalReadings}</span></div>}
                  <div className="info-item-enad"><span className="info-label-enad">Assessment Fee</span><span className="info-value-enad">{formatCurrency(selectedItem.assessmentFee)}</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Payment Status</span><span className={`status-badge-enad ${selectedItem.paymentStatus === 'paid' ? 'completed-enad' : 'pending-enad'}`}>{selectedItem.paymentStatus}</span></div>
                </div>

                {deviceAssigned ? (
                  <div className="device-card-enad">
                    <div className="device-card-title-enad">Assigned Device</div>
                    <div className="device-info-enad">
                      <div className="device-info-item-enad">
                        <span className="device-info-label-enad">Device ID</span>
                        <span className="device-info-value-enad">{selectedItem.iotDeviceId?.deviceId || selectedItem.assignedDevice?.deviceId || selectedItem.assignedDeviceId || 'N/A'}</span>
                      </div>
                      <div className="device-info-item-enad">
                        <span className="device-info-label-enad">Device Name</span>
                        <span className="device-info-value-enad">{selectedItem.iotDeviceId?.deviceName || selectedItem.assignedDevice?.deviceName || 'IoT Device'}</span>
                      </div>
                      <div className="device-info-item-enad">
                        <span className="device-info-label-enad">Status</span>
                        <span className={`device-info-value-enad ${selectedItem.deviceDeployedAt ? 'text-green-600' : 'text-yellow-600'}`}>
                          {selectedItem.deviceDeployedAt ? 'Deployed' : 'Ready for Deployment'}
                        </span>
                      </div>
                      {selectedItem.deviceDeployedAt && (
                        <div className="device-info-item-enad">
                          <span className="device-info-label-enad">Deployed At</span>
                          <span className="device-info-value-enad">{formatDateTime(selectedItem.deviceDeployedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="no-device-card-enad">No device assigned yet. Please contact admin.</div>
                )}
              </div>
            )}

            {/* Site Inspection Tab */}
            {activeTab === 'site-inspection' && (
              <div>
                <div className="action-buttons-enad">
                  <button onClick={saveSiteAssessment} disabled={submitting} className="btn-secondary-enad">{submitting ? 'Saving...' : 'Save Draft'}</button>
                  {selectedItem.assessmentStatus !== 'device_deployed' && selectedItem.assessmentStatus !== 'data_collecting' && deviceAssigned && (<button onClick={openDeployConfirmModal} disabled={submitting || !deployNotes || deployNotes.trim() === ''} className="btn-success-enad" style={{ opacity: (!deployNotes || deployNotes.trim() === '') ? 0.5 : 1 }}>{submitting ? 'Deploying...' : 'Deploy Device (Start 7-day Monitoring)'}</button>)}
                </div>
                <div className="form-group-enad">
                  <label className="form-label-enad">Roof Condition</label>
                  <div className="options-group-enad">
                    {ROOF_CONDITIONS.map(condition => (
                      <button key={condition.value} type="button" onClick={() => handleAssessmentFormChange('roofCondition', condition.value)} className={`option-btn-enad ${assessmentForm.roofCondition === condition.value ? 'active-enad' : ''}`}>{condition.label}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group-enad">
                  <label className="form-label-enad">Roof Dimensions (meters) *</label>
                  <div className="form-row-enad">
                    <div className="dimension-input-enad">
                      <input type="number" step="0.1" className="assessment-form-input-enad" value={assessmentForm.roofLength || ''} onChange={(e) => handleAssessmentFormChange('roofLength', parseFloat(e.target.value))} placeholder="Length (m)" required />
                    </div>
                    <div className="dimension-input-enad">
                      <input type="number" step="0.1" className="assessment-form-input-enad" value={assessmentForm.roofWidth || ''} onChange={(e) => handleAssessmentFormChange('roofWidth', parseFloat(e.target.value))} placeholder="Width (m)" required />
                    </div>
                  </div>
                  <small className="form-hint-enad">Measured during site inspection (Required)</small>
                </div>
                <div className="form-group-enad">
                  <label className="form-label-enad">Structural Integrity</label>
                  <div className="options-group-enad">
                    {STRUCTURAL_INTEGRITY.map(integrity => (
                      <button key={integrity.value} type="button" onClick={() => handleAssessmentFormChange('structuralIntegrity', integrity.value)} className={`option-btn-enad ${assessmentForm.structuralIntegrity === integrity.value ? 'active-enad' : ''}`}>{integrity.label}</button>
                    ))}
                  </div>
                </div>
                <div className="form-group-enad">
                  <label className="form-label-enad">Estimated Installation Time (days)</label>
                  <input type="number" className="assessment-form-input-enad" value={assessmentForm.estimatedInstallationTime} onChange={(e) => handleAssessmentFormChange('estimatedInstallationTime', e.target.value)} style={{ width: '150px' }} required />
                </div>
                {deviceAssigned && (
                  <div className="form-group-enad">
                    <label className="form-label-enad">Deployment Notes *</label>
                    <textarea className="assessment-form-textarea-enad" value={deployNotes} onChange={(e) => setDeployNotes(e.target.value)} rows={3} placeholder="Enter deployment notes, device placement location, etc... (Required)" required />
                    {!deployNotes && (<small className="form-hint-enad" style={{ color: '#C62828' }}>Deployment notes are required before deploying the device</small>)}
                  </div>
                )}
                <div className="form-group-enad">
                  <label className="form-label-enad">Site Visit Notes</label>
                  <textarea className="assessment-form-textarea-enad" value={assessmentForm.siteVisitNotes} onChange={(e) => handleAssessmentFormChange('siteVisitNotes', e.target.value)} rows={4} placeholder="Additional notes, observations, recommendations..." required />
                </div>
                <div className="form-group-enad">
                  <label className="form-label-enad">Engineer Recommendations</label>
                  <textarea className="assessment-form-textarea-enad" value={assessmentForm.recommendations} onChange={(e) => handleAssessmentFormChange('recommendations', e.target.value)} rows={3} placeholder="Summary of recommendations for the client..." required />
                </div>
                <div className="form-group-enad">
                  <label className="form-label-enad">Technical Findings</label>
                  <textarea className="assessment-form-textarea-enad" value={assessmentForm.technicalFindings} onChange={(e) => handleAssessmentFormChange('technicalFindings', e.target.value)} rows={3} placeholder="Technical observations, electrical assessment, structural findings..." required />
                </div>
              </div>
            )}

            {/* Quotation Tab */}
            {activeTab === 'quotation' && (
              <div className="quotation-tab-enhanced">
                <div className="action-buttons-enad">
                  {selectedItem.assessmentStatus !== 'completed' && (
                    <button onClick={openReportConfirmModal} disabled={submitting} className="btn-success-enad">
                      {submitting ? 'Submitting...' : 'Submit Final Report'}
                    </button>
                  )}
                </div>

                <div className="form-group-enad">
                  <label className="form-label-enad">
                    <input type="checkbox" checked={includeIoTData} onChange={(e) => setIncludeIoTData(e.target.checked)} style={{ marginRight: '8px' }} />
                    Include IoT Data Analysis in PDF
                  </label>
                  {selectedItem.dataCollectionStart && selectedItem.dataCollectionEnd && (
                    <small className="form-hint-enad">IoT data collected from {formatDateTime(selectedItem.dataCollectionStart)} to {formatDateTime(selectedItem.dataCollectionEnd)}</small>
                  )}
                </div>

                {/* IoT Monitoring Results */}
                {assessmentResults && (
                  <div className="iot-metrics-section">
                    <h4>IoT Monitoring Results (7-Day Data Collection)</h4>
                    <div className="iot-metrics-grid">
                      <div className="metric-item">
                        <div>
                          <label>Peak Sun Hours</label>
                          <span><strong>{assessmentResults.peakSunHours?.toFixed(1) || '—'}</strong> hrs/day</span>
                        </div>
                      </div>
                      <div className="metric-item">
                        <div>
                          <label>Average Irradiance</label>
                          <span>{assessmentResults.averageIrradiance?.toFixed(0) || '—'} W/m²</span>
                        </div>
                      </div>
                      <div className="metric-item">
                        <div>
                          <label>Max Irradiance</label>
                          <span>{assessmentResults.maxIrradiance?.toFixed(0) || '—'} W/m²</span>
                        </div>
                      </div>
                      <div className="metric-item">
                        <div>
                          <label>Min Irradiance</label>
                          <span>{assessmentResults.minIrradiance?.toFixed(0) || '—'} W/m²</span>
                        </div>
                      </div>
                      <div className="metric-item">
                        <div>
                          <label>Average Temperature</label>
                          <span>{assessmentResults.averageTemperature?.toFixed(1) || '—'}°C</span>
                        </div>
                      </div>
                      <div className="metric-item">
                        <div>
                          <label>Temperature Range</label>
                          <span>{assessmentResults.minTemperature?.toFixed(1) || '—'}°C - {assessmentResults.maxTemperature?.toFixed(1) || '—'}°C</span>
                        </div>
                      </div>
                      <div className="metric-item">
                        <div>
                          <label>Average Humidity</label>
                          <span>{assessmentResults.averageHumidity?.toFixed(0) || '—'}%</span>
                        </div>
                      </div>
                      <div className="metric-item">
                        <div>
                          <label>Humidity Range</label>
                          <span>{assessmentResults.minHumidity?.toFixed(0) || '—'}% - {assessmentResults.maxHumidity?.toFixed(0) || '—'}%</span>
                        </div>
                      </div>
                      {assessmentResults.gpsCoordinates?.latitude && assessmentResults.gpsCoordinates?.longitude && (
                        <div className="metric-item full-width">
                          <div>
                            <label>GPS Location</label>
                            <span>
                              {assessmentResults.gpsCoordinates.latitude.toFixed(6)}, {assessmentResults.gpsCoordinates.longitude.toFixed(6)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* System Recommendations - From Backend */}
                {loadingMetrics ? (
                  <div className="loading-metrics">Loading system recommendations...</div>
                ) : systemMetrics ? (
                  <>
                    <div className="system-recommendations">
                      <h4>System Recommendation</h4>
                      <div className="recommendations-grid">
                        <div className="rec-item">
                          <label>Recommended System Size</label>
                          <strong>{systemMetrics.recommendedSystemSize} kWp</strong>
                        </div>

                        {/* Only show Battery Size for Hybrid or Off-Grid, NOT for Grid-Tie */}
                        {systemMetrics.systemType !== 'grid-tie' && (
                          <div className="rec-item">
                            <label>Battery Size</label>
                            <strong>{systemMetrics.batteryCapacityKwh} kWh</strong>
                          </div>
                        )}

                        <div className="rec-item">
                          <label>Inverter Size</label>
                          <strong>{systemMetrics.inverterSize} kW</strong>
                        </div>
                        <div className="rec-item">
                          <label>Optimal Orientation</label>
                          <strong>{systemMetrics.optimalOrientation}</strong>
                        </div>
                        <div className="rec-item">
                          <label>Optimal Tilt Angle</label>
                          <strong>{systemMetrics.optimalTilt}°</strong>
                        </div>
                        <div className="rec-item">
                          <label>Available Roof Area</label>
                          <strong>{systemMetrics.availableRoofArea} m²</strong>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="no-metrics">No system recommendations available yet. Please ensure IoT data has been collected and device has been retrieved.</div>
                )}

                {/* Basic Info Form */}
                <div className="quotation-section">
                  <h4>Basic Information</h4>
                  <div className="form-grid-enad">
                    <div className="form-group-enad">
                      <label className="form-label-enad">Quotation Number</label>
                      <input type="text" className="assessment-form-input-enad" value={quotationForm.quotationNumber} onChange={(e) => handleQuotationChange('quotationNumber', e.target.value)} />
                    </div>
                    <div className="form-group-enad">
                      <label className="form-label-enad">Expiry Date (30 Days)</label>
                      <input type="date" className="assessment-form-input-enad" value={quotationForm.quotationExpiryDate} onChange={(e) => handleQuotationChange('quotationExpiryDate', e.target.value)} />
                    </div>
                    <div className="form-group-enad">
                      <label className="form-label-enad">System Type</label>
                      <select className="assessment-form-select-enad" value={quotationForm.systemType} onChange={(e) => handleQuotationChange('systemType', e.target.value)}>
                        {SYSTEM_TYPES.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad">
                      <label className="form-label-enad">System Size (kWp)</label>
                      <input type="number" step="0.5" className="assessment-form-input-enad" value={quotationForm.systemSize} onChange={(e) => handleQuotationChange('systemSize', parseFloat(e.target.value))} placeholder="e.g., 5.0" />
                    </div>
                  </div>
                </div>

                {/* Solar Panels */}
                <div className="quotation-section">
                  <h4>Solar Panels</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select className="assessment-form-select-enad" value={selectedPanel?._id || ''} onChange={(e) => { const panel = availablePanels.find(p => p._id === e.target.value); setSelectedPanel(panel); if (panel && panel.unit === 'watt') setPanelQuantity(1); }}>
                        <option value="">-- Select Panel --</option>
                        {availablePanels.filter(p => p.isActive).map(panel => (<option key={panel._id} value={panel._id}>{panel.name} - {panel.brand} - ₱{panel.price.toLocaleString()}/{panel.unit}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <input type="number" min="1" className="assessment-form-input-enad" value={panelQuantity} onChange={(e) => setPanelQuantity(parseInt(e.target.value) || 0)} disabled={selectedPanel?.unit === 'watt'} />
                    </div>
                    <div className="cost-display"><label>Panel Cost</label><div className="cost-value">{formatCurrency(calculatedCosts.panelCost)}</div></div>
                  </div>
                  {selectedPanel?.unit === 'watt' && <small className="form-hint-enad">Price is per watt. Total calculated based on system size: {quotationForm.systemSize} kWp</small>}
                </div>

                {/* Inverters */}
                <div className="quotation-section">
                  <h4>Inverters</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select className="assessment-form-select-enad" value={selectedInverter?._id || ''} onChange={(e) => { const inverter = availableInverters.find(i => i._id === e.target.value); setSelectedInverter(inverter); }}>
                        <option value="">-- Select Inverter --</option>
                        {availableInverters.filter(i => i.isActive).map(inverter => (<option key={inverter._id} value={inverter._id}>{inverter.name} - {inverter.brand} - ₱{inverter.price.toLocaleString()}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <input type="number" min="1" className="assessment-form-input-enad" value={inverterQuantity} onChange={(e) => setInverterQuantity(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="cost-display"><label>Inverter Cost</label><div className="cost-value">{formatCurrency(calculatedCosts.inverterCost)}</div></div>
                  </div>
                </div>

                {/* Batteries */}
                <div className="quotation-section">
                  <h4>Batteries (Optional)</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select className="assessment-form-select-enad" value={selectedBattery?._id || ''} onChange={(e) => { const battery = availableBatteries.find(b => b._id === e.target.value); setSelectedBattery(battery); }}>
                        <option value="">-- No Battery --</option>
                        {availableBatteries.filter(b => b.isActive).map(battery => (<option key={battery._id} value={battery._id}>{battery.name} - {battery.brand} - ₱{battery.price.toLocaleString()}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <input type="number" min="0" className="assessment-form-input-enad" value={batteryQuantity} onChange={(e) => setBatteryQuantity(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="cost-display"><label>Battery Cost</label><div className="cost-value">{formatCurrency(calculatedCosts.batteryCost)}</div></div>
                  </div>
                </div>

                {/* Mounting Structure */}
                <div className="quotation-section">
                  <h4>Mounting Structure</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select className="assessment-form-select-enad" value={selectedMountingStructure?._id || ''} onChange={(e) => { const structure = availableMountingStructures.find(m => m._id === e.target.value); setSelectedMountingStructure(structure); }}>
                        <option value="">-- Select Mounting Structure --</option>
                        {availableMountingStructures.filter(m => m.isActive).map(structure => (<option key={structure._id} value={structure._id}>{structure.name} - {structure.brand} - ₱{structure.price.toLocaleString()}/{structure.unit}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}>
                      <input type="number" min="1" className="assessment-form-input-enad" value={mountingStructureQuantity} onChange={(e) => setMountingStructureQuantity(parseInt(e.target.value) || 0)} />
                    </div>
                    <div className="cost-display"><label>Mounting Cost</label><div className="cost-value">{formatCurrency(calculatedCosts.mountingCost)}</div></div>
                  </div>
                </div>

                {/* Electrical Components */}
                <div className="quotation-section">
                  <h4>Electrical Components</h4>
                  <button type="button" className="btn-add-item" onClick={addElectricalComponent}>+ Add Component</button>
                  {selectedElectricalComponents.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => updateElectricalComponent(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Component --</option>
                        {availableElectricalComponents.filter(c => c.isActive).map(comp => (
                          <option key={comp._id} value={comp._id}>{comp.name} - ₱{comp.price.toLocaleString()}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => updateElectricalComponent(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeElectricalComponent(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Cables */}
                <div className="quotation-section">
                  <h4>Cables and Wiring</h4>
                  <button type="button" className="btn-add-item" onClick={addCable}>+ Add Cable</button>
                  {selectedCables.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => updateCable(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Cable Type --</option>
                        {availableCables.filter(c => c.isActive).map(cable => (
                          <option key={cable._id} value={cable._id}>{cable.name} - ₱{cable.price.toLocaleString()}/{cable.unit}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Length (m)" className="assessment-form-input-enad" value={item.length} onChange={(e) => updateCable(index, 'length', parseFloat(e.target.value) || 0)} style={{ width: '100px' }} />
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => updateCable(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeCable(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Junction Boxes */}
                <div className="quotation-section">
                  <h4>Junction Boxes</h4>
                  <button type="button" className="btn-add-item" onClick={addJunctionBox}>+ Add Junction Box</button>
                  {selectedJunctionBoxes.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => updateJunctionBox(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Junction Box --</option>
                        {availableJunctionBoxes.filter(j => j.isActive).map(box => (
                          <option key={box._id} value={box._id}>{box.name} - ₱{box.price.toLocaleString()}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => updateJunctionBox(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeJunctionBox(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Disconnect Switches */}
                <div className="quotation-section">
                  <h4>Disconnect Switches</h4>
                  <button type="button" className="btn-add-item" onClick={addDisconnectSwitch}>+ Add Switch</button>
                  {selectedDisconnectSwitches.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => updateDisconnectSwitch(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Switch --</option>
                        {availableDisconnectSwitches.filter(s => s.isActive).map(sw => (
                          <option key={sw._id} value={sw._id}>{sw.name} - ₱{sw.price.toLocaleString()}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => updateDisconnectSwitch(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeDisconnectSwitch(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Meters */}
                <div className="quotation-section">
                  <h4>Meters</h4>
                  <button type="button" className="btn-add-item" onClick={addMeter}>+ Add Meter</button>
                  {selectedMeters.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select className="assessment-form-select-enad" value={item.id || ''} onChange={(e) => updateMeter(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Meter --</option>
                        {availableMeters.filter(m => m.isActive).map(meter => (
                          <option key={meter._id} value={meter._id}>{meter.name} - ₱{meter.price.toLocaleString()}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => updateMeter(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeMeter(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Additional Equipment */}
                <div className="quotation-section">
                  <h4>Additional Equipment</h4>
                  <button type="button" className="btn-add-item" onClick={addAdditionalEquipment}>+ Add Custom Item</button>
                  {additionalEquipment.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <input type="text" placeholder="Item name" className="assessment-form-input-enad" value={item.name} onChange={(e) => updateAdditionalEquipment(index, 'name', e.target.value)} style={{ flex: 2 }} />
                      <input type="number" placeholder="Qty" className="assessment-form-input-enad" value={item.quantity} onChange={(e) => updateAdditionalEquipment(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <input type="number" placeholder="Price" className="assessment-form-input-enad" value={item.price} onChange={(e) => updateAdditionalEquipment(index, 'price', parseFloat(e.target.value) || 0)} style={{ width: '120px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeAdditionalEquipment(index)}>Remove</button>
                    </div>
                  ))}
                </div>

                {/* Installation Labor */}
                <div className="quotation-section">


                  {/* Labor Cost Percentage Input */}
                  <div className="labor-percentage-control" style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px', flexWrap: 'wrap' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                          Labor Cost (% of Equipment)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="0"
                          max="100"
                          className="assessment-form-input-enad"
                          value={laborCostPercentage}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            setLaborCostPercentage(Math.min(100, Math.max(0, value)));
                            setTimeout(() => calculateTotalCosts(), 0);
                          }}
                          style={{ width: '100px' }}
                        />
                        <small className="form-hint-enad">Default: 20% of total equipment cost</small>
                      </div>
                    </div>
                  </div>

                  {/* Labor Cost Display */}
                  <div className="labor-calculation">
                    <div className="labor-detail">
                      <span>Total Equipment Cost:</span>
                      <span>{formatCurrency(calculatedCosts.totalEquipmentCost)}</span>
                    </div>
                    <div className="labor-detail">
                      <span>Labor Cost ({laborCostPercentage}%):</span>
                      <span>{formatCurrency(calculatedCosts.installationLaborCost)}</span>
                    </div>
                    <div className="labor-total">
                      <strong>Subtotal</strong>
                      <strong>{formatCurrency(calculatedCosts.subtotalCost)}</strong>
                    </div>
                  </div>
                </div>

                {/* Overhead & Contingency */}
                <div className="quotation-section">

                  <div className="cost-percentage-control" style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Overhead & Contingency
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        className="assessment-form-input-enad"
                        value={overheadContingencyPercentage}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setOverheadContingencyPercentage(Math.min(100, Math.max(0, value)));
                          setTimeout(() => calculateTotalCosts(), 0);
                        }}
                        style={{ width: '100px' }}
                      />

                    </div>
                  </div>
                  <div className="cost-calculation">

                    <div className="cost-detail">
                      <span>Overhead & Contingency ({overheadContingencyPercentage}%):</span>
                      <span>{formatCurrency(calculatedCosts.overheadContingencyCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Contractor Profit */}
                <div className="quotation-section">

                  <div className="cost-percentage-control" style={{ marginBottom: '15px', padding: '10px', background: '#f8f9fa', borderRadius: '8px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                        Contractor Profit
                      </label>
                      <input
                        type="number"
                        step="1"
                        min="0"
                        max="100"
                        className="assessment-form-input-enad"
                        value={contractorProfitPercentage}
                        onChange={(e) => {
                          const value = parseInt(e.target.value) || 0;
                          setContractorProfitPercentage(Math.min(100, Math.max(0, value)));
                          setTimeout(() => calculateTotalCosts(), 0);
                        }}
                        style={{ width: '100px' }}
                      />

                    </div>
                  </div>
                  <div className="cost-calculation">

                    <div className="cost-detail">
                      <span>Contractor Profit ({contractorProfitPercentage}%):</span>
                      <span>{formatCurrency(calculatedCosts.contractorProfitCost)}</span>
                    </div>
                  </div>
                </div>

                {/* Complete Cost Summary */}
                <div className="cost-summary-large">
                  <h3>Complete Cost Summary</h3>
                  <div className="summary-row"><span>Solar Panels:</span><span>{formatCurrency(calculatedCosts.panelCost)}</span></div>
                  <div className="summary-row"><span>Inverters:</span><span>{formatCurrency(calculatedCosts.inverterCost)}</span></div>
                  <div className="summary-row"><span>Batteries:</span><span>{formatCurrency(calculatedCosts.batteryCost)}</span></div>
                  <div className="summary-row"><span>Mounting Structure:</span><span>{formatCurrency(calculatedCosts.mountingCost)}</span></div>
                  <div className="summary-row"><span>Electrical Components:</span><span>{formatCurrency(calculatedCosts.electricalCost)}</span></div>
                  <div className="summary-row"><span>Cables and Wiring:</span><span>{formatCurrency(calculatedCosts.cableCost)}</span></div>
                  <div className="summary-row"><span>Junction Boxes:</span><span>{formatCurrency(calculatedCosts.junctionBoxCost)}</span></div>
                  <div className="summary-row"><span>Disconnect Switches:</span><span>{formatCurrency(calculatedCosts.disconnectSwitchCost)}</span></div>
                  <div className="summary-row"><span>Meters:</span><span>{formatCurrency(calculatedCosts.meterCost)}</span></div>
                  <div className="summary-row"><span>Additional Equipment:</span><span>{formatCurrency(calculatedCosts.additionalCost)}</span></div>
                  <div className="summary-row"><span>Equipment Total:</span><span>{formatCurrency(calculatedCosts.totalEquipmentCost)}</span></div>
                  <div className="summary-row"><span>Installation Labor:</span><span>{formatCurrency(calculatedCosts.installationLaborCost)}</span></div>
                  <div className="summary-row"><span>Direct Cost:</span><span>{formatCurrency(calculatedCosts.subtotalCost)}</span></div>
                  <div className="summary-row"><span>Overhead & Contingency:</span><span>{formatCurrency(calculatedCosts.overheadContingencyCost)}</span></div>
                  <div className="summary-row"><span>Contractor Profit:</span><span>{formatCurrency(calculatedCosts.contractorProfitCost)}</span></div>
                  <div className="summary-row total"><span>TOTAL SYSTEM COST:</span><span>{formatCurrency(calculatedCosts.totalSystemCost)}</span></div>
                </div>

                <div className="action-buttons-enad" style={{ marginTop: '20px' }}>
                  <button onClick={generateQuotationPDF} disabled={generatingPDF || !quotationForm.systemSize || calculatedCosts.totalSystemCost === 0} className="btn-primary-enad">
                    {generatingPDF ? 'Generating...' : 'Generate and Upload PDF'}
                  </button>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div>
                <div className="action-buttons-enad">
                  <button onClick={() => setShowImageUploader(!showImageUploader)} className="btn-primary-enad">Upload Photos</button>
                </div>
                {showImageUploader && (
                  <div className="file-upload-enad">
                    <input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="file-upload-input-enad" />
                    {uploading && (<div className="uploading-enad">Uploading images...</div>)}
                  </div>
                )}
                <div className="image-grid-enad">
                  {siteImages.map((image, idx) => (
                    <div key={idx} className="image-card-enad">
                      <img src={image} alt={`Site photo ${idx + 1}`} />
                      <div className="image-overlay-enad">
                        <a href={image} target="_blank" rel="noopener noreferrer" className="image-overlay-icon-enad">View</a>
                      </div>
                    </div>
                  ))}
                </div>
                {siteImages.length === 0 && (
                  <div className="empty-state-enad"><p>No photos uploaded yet</p></div>
                )}
              </div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div>
                <div className="comment-input-wrapper-enad">
                  <textarea className="assessment-form-textarea-enad" value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." rows={3} />
                  <button onClick={addComment} disabled={submitting || !commentText.trim()} className="comment-send-btn-enad">Send</button>
                </div>
                <div className="comment-list-enad">
                  {selectedItem.engineerComments?.length === 0 && (
                    <div className="empty-state-enad"><p>No comments yet</p></div>
                  )}
                  {selectedItem.engineerComments?.map((comment, idx) => (
                    <div key={idx} className="comment-item-enad">
                      <div className="comment-header-enad">
                        <div className="comment-user-enad">
                          <div className="comment-avatar-enad"></div>
                          <div>
                            <p className="comment-name-enad">{comment.commentedBy?.firstName} {comment.commentedBy?.lastName}</p>
                            <p className="comment-time-enad">{formatDateTime(comment.commentedAt)}</p>
                          </div>
                        </div>
                        {comment.isPublic && <span className="comment-badge-enad">Public</span>}
                      </div>
                      <p className="comment-text-enad">{comment.comment}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showDeployConfirmModal && selectedItem && (
        <div className="modal-overlay-enad" onClick={closeDeployConfirmModal}>
          <div className="modal-content-enad confirm-modal-enad" onClick={e => e.stopPropagation()}>
            <div className="modal-header-enad">
              <h3>Confirm Device Deployment</h3>
              <button className="modal-close-enad" onClick={closeDeployConfirmModal}>×</button>
            </div>
            <div className="modal-body-enad">
              <div className="confirm-message-enad">
                <p>Are you sure you want to deploy the device on site?</p>
              </div>
              <div className="device-details-confirm-enad">
                <div className="detail-row-enad">
                  <span className="detail-label-enad">Device ID:</span>
                  <span className="detail-value-enad">{selectedItem.iotDeviceId?.deviceId || selectedItem.assignedDeviceId || 'N/A'}</span>
                </div>
                <div className="detail-row-enad">
                  <span className="detail-label-enad">Device Name:</span>
                  <span className="detail-value-enad">{selectedItem.iotDeviceId?.deviceName || selectedItem.assignedDevice?.deviceName || 'IoT Device'}</span>
                </div>
                <div className="detail-row-enad">
                  <span className="detail-label-enad">Device Status:</span>
                  <span className="detail-value-enad" style={{ color: '#4CAF50' }}>Assigned ✓</span>
                </div>
                <div className="detail-row-enad">
                  <span className="detail-label-enad">Location:</span>
                  <span className="detail-value-enad">{getFullAddress(selectedItem.address)}</span>
                </div>
                <div className="detail-row-enad">
                  <span className="detail-label-enad">Deployment Notes:</span>
                  <span className="detail-value-enad">{deployNotes}</span>
                </div>
              </div>
              <div className="warning-box-enad">
                <p>This action will:</p>
                <ul>
                  <li>Start 7-day data collection period</li>
                  <li>The device status will be updated to "deployed"</li>
                  <li>The device cannot be reassigned during this period</li>
                </ul>
              </div>
            </div>
            <div className="modal-actions-enad">
              <button className="cancel-btn-enad" onClick={closeDeployConfirmModal}>Cancel</button>
              <button className="confirm-deploy-btn-enad" onClick={deployDevice} disabled={submitting}>
                {submitting ? 'Deploying...' : 'Confirm Deployment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submit Final Report Confirmation Modal */}
      {showReportConfirmModal && (
        <div className="modal-overlay-enad" onClick={closeReportConfirmModal}>
          <div className="modal-content-enad confirm-modal-enad" onClick={e => e.stopPropagation()}>
            <div className="modal-header-enad">
              <h3>Confirm Final Report Submission</h3>
              <button className="modal-close-enad" onClick={closeReportConfirmModal}>×</button>
            </div>
            <div className="modal-body-enad">
              <div className="confirm-message-enad">
                <p>Are you sure you want to submit the final report?</p>
              </div>
              <div className="warning-box-enad">
                <p>This action cannot be undone.</p>
              </div>
            </div>
            <div className="modal-actions-enad">
              <button className="cancel-btn-enad" onClick={closeReportConfirmModal}>Cancel</button>
              <button className="confirm-submit-btn-enad" onClick={submitFinalReport} disabled={submitting}>
                {submitting ? 'Submitting...' : 'Confirm Submission'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MyAssessments;