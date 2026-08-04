// pages/Engineer/MyAssessments.jsx
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import '../../styles/Engineer/siteassessment.css';

// Import Calculation Card Components
import {
  AreaCalculationCard,
  ElectricityCalculationCard,
  NetMeteringCalculationCard,
  CalculationResultsCard
} from '../../components/Engineer/SystemCalculationCards.jsx';

// Import Equipment Selection Component
import { SystemEquipmentSelection } from '../../components/Engineer/SystemEquipmentSelection.jsx';
import SiteInspectionTab from '../../components/Engineer/SiteInspectionTab.jsx';
// Import Calculation Hook
import { useSystemCalculation } from '../../hooks/useSystemCalculation.js';

import { useToast, ToastNotification } from '../../assets/toastnotification'; // Add this import

const MyAssessments = () => {
  const { toast, showToast, hideToast } = useToast();
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



  // ✅ MOVE THIS HERE - Appliance modal states
  const [editingAppliance, setEditingAppliance] = useState(null);
  const [applianceForm, setApplianceForm] = useState({
    name: '',
    powerWatts: '',
    quantity: '',
    dayHours: '',
    nightHours: '',
    isMotor: false
  });
  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [applianceErrors, setApplianceErrors] = useState({});

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(5);

  const [laborCostPercentage, setLaborCostPercentage] = useState(20);
  const [overheadContingencyPercentage, setOverheadContingencyPercentage] = useState(15);
  const [contractorProfitPercentage, setContractorProfitPercentage] = useState(10);
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
    subtotalCost: 0,
    overheadContingencyCost: 0,
    contractorProfitCost: 0,
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
    subtotalCost: 0,
    overheadContingencyCost: 0,
    contractorProfitCost: 0,
    totalSystemCost: 0
  });

  // ✅ MOVE THIS HERE - Site Inspection Data State
  const [siteInspectionData, setSiteInspectionData] = useState({
    appliances: [],
    monthlyBill: '',
    ratePerKwh: '',
    systemType: '',
    roofType: ''
  });
  const saveSiteInspectionData = async () => {
    // Validate only the required fields
    if (!validateAssessmentForm()) return;

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('token');

      const payload = {
        // From assessmentForm (existing fields)
        roofCondition: assessmentForm.roofCondition,
        roofLength: parseFloat(assessmentForm.roofLength) || 0,
        roofWidth: parseFloat(assessmentForm.roofWidth) || 0,
        structuralIntegrity: assessmentForm.structuralIntegrity,
        estimatedInstallationTime: assessmentForm.estimatedInstallationTime,
        recommendations: assessmentForm.recommendations,
        technicalFindings: assessmentForm.technicalFindings,
        siteVisitNotes: assessmentForm.siteVisitNotes,

        // From siteInspectionData (new fields)
        appliances: siteInspectionData.appliances,
        monthlyBill: parseFloat(siteInspectionData.monthlyBill) || 0,
        rate: parseFloat(siteInspectionData.ratePerKwh) || 0,
        systemType: siteInspectionData.systemType || 'grid-tie',
        roofType: siteInspectionData.roofType || ''
      };

      const response = await axios.put(
        `${API_BASE_URL}/api/pre-assessments/${selectedItem._id}/update-assessment`,
        payload,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      showToast('Site inspection data saved successfully!', 'success');
      await fetchPreAssessmentDetails(selectedItem._id);

    } catch (err) {
      console.error('Error saving assessment:', err);
      showToast(err.response?.data?.message || 'Failed to save assessment', 'error');
    } finally {
      setSubmitting(false);
    }
  };
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



  // Use the calculation hook
  const calculation = useSystemCalculation();

  // Fetch system recommendations for pre-assessment
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

    const installationLaborCost = totalEquipmentCost * (laborCostPercentage / 100);
    const subtotalCost = totalEquipmentCost + installationLaborCost;
    const overheadContingencyCost = subtotalCost * (overheadContingencyPercentage / 100);
    const contractorProfitCost = subtotalCost * (contractorProfitPercentage / 100);
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
      subtotalCost,
      overheadContingencyCost,
      contractorProfitCost,
      totalSystemCost
    });

    setFreeQuoteForm(prev => ({
      ...prev,
      equipmentCost: totalEquipmentCost,
      installationCost: installationLaborCost,
      totalCost: totalSystemCost,
      panelsNeeded: freeQuotePanelQuantity
    }));
  };

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

    const installationLaborCost = totalEquipmentCost * (laborCostPercentage / 100);
    const subtotalCost = totalEquipmentCost + installationLaborCost;
    const overheadContingencyCost = subtotalCost * (overheadContingencyPercentage / 100);
    const contractorProfitCost = subtotalCost * (contractorProfitPercentage / 100);
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
      subtotalCost,
      overheadContingencyCost,
      contractorProfitCost,
      totalSystemCost
    });

    setQuotationForm(prev => ({
      ...prev,
      equipmentCost: totalEquipmentCost,
      installationCost: installationLaborCost,
      totalCost: totalSystemCost,
      panelsNeeded: panelQuantity
    }));
  };

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
    accepted: { label: 'Accepted', color: 'processing-enad' },
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
        roofWidth: quote.roofWidth,
        recommendedSystemSize: quote.recommendedSystemSize || null,
        inverterSize: quote.inverterSize || null,
        batteryCapacityKwh: quote.batteryCapacityKwh || null,
        panelsNeeded: quote.panelsNeeded || null,
        totalDailyConsumption: quote.totalDailyConsumption || null,
        dayPercentage: quote.dayPercentage || null,
        nightPercentage: quote.nightPercentage || null,
        targetSavings: quote.targetSavings || null,
        estimatedAnnualProduction: quote.estimatedAnnualProduction || null,
        estimatedAnnualProductionMin: quote.estimatedAnnualProductionMin || null,
        estimatedAnnualProductionMax: quote.estimatedAnnualProductionMax || null,
        co2Offset: quote.co2Offset || null,
        co2OffsetMin: quote.co2OffsetMin || null,
        co2OffsetMax: quote.co2OffsetMax || null
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
        totalReadings: assessment.totalReadings,
        recommendedSystemSize: assessment.recommendedSystemSize || null,
        inverterSize: assessment.inverterSize || null,
        batteryCapacityKwh: assessment.batteryCapacityKwh || null,
        panelsNeeded: assessment.panelsNeeded || null,
        totalDailyConsumption: assessment.totalDailyConsumption || null,
        dayPercentage: assessment.dayPercentage || null,
        nightPercentage: assessment.nightPercentage || null,
        targetSavings: assessment.targetSavings || null
      }));

      setFreeQuotes(formattedFreeQuotes);
      setPreAssessments(formattedPreAssessments);
      const sortedPreAssessments = formattedPreAssessments.sort((a, b) =>
        new Date(b.createdAt || b.requestedAt) - new Date(a.createdAt || a.requestedAt)
      );

      setAllAssessments([...formattedFreeQuotes, ...sortedPreAssessments]);
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
      resetCalculationState();
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

      // Ensure all numeric fields are properly parsed
      const formattedQuote = {
        ...quote,
        clientName: quote.clientId?.contactFirstName || '',
        clientLastName: quote.clientId?.contactLastName || '',
        clientEmail: quote.clientId?.userId?.email || '',
        clientPhone: quote.clientId?.contactNumber || '',
        clientType: quote.clientId?.client_type || 'Residential',
        address: addressData,
        systemType: quote.systemType || 'grid-tie',
        // Ensure all numeric fields are numbers
        roofLength: parseFloat(quote.roofLength) || 0,
        roofWidth: parseFloat(quote.roofWidth) || 0,
        recommendedSystemSize: parseFloat(quote.recommendedSystemSize) || null,
        inverterSize: parseFloat(quote.inverterSize) || null,
        batteryCapacityKwh: parseFloat(quote.batteryCapacityKwh) || null,
        panelsNeeded: parseInt(quote.panelsNeeded) || null,
        monthlyConsumption: parseFloat(quote.monthlyConsumption) || null,
        dayConsumption: parseFloat(quote.dayConsumption) || 0,
        nightConsumption: parseFloat(quote.nightConsumption) || 0,
        dayPercentage: parseFloat(quote.dayPercentage) || null,
        nightPercentage: parseFloat(quote.nightPercentage) || null,
        totalDailyConsumption: parseFloat(quote.totalDailyConsumption) || 0,
        targetSavings: parseFloat(quote.targetSavings) || null,
        monthlyBill: parseFloat(quote.monthlyBill) || 0,
        rate: parseFloat(quote.rate) || 12,
        estimatedAnnualProduction: parseFloat(quote.estimatedAnnualProduction) || null,
        estimatedAnnualProductionMin: parseFloat(quote.estimatedAnnualProductionMin) || null,
        estimatedAnnualProductionMax: parseFloat(quote.estimatedAnnualProductionMax) || null,
        co2Offset: parseFloat(quote.co2Offset) || null,
        co2OffsetMin: parseFloat(quote.co2OffsetMin) || null,
        co2OffsetMax: parseFloat(quote.co2OffsetMax) || null
      };

      setSelectedItem(formattedQuote);
      setSelectedType('free_quote');

      // Initialize calculation data with the formatted quote
      calculation.initializeFromData(formattedQuote);

      const autoExpiryDate = getExpiryDate30Days();

      setFreeQuoteForm({
        quotationNumber: formattedQuote.quotationReference || '',
        quotationExpiryDate: autoExpiryDate,
        systemSize: formattedQuote.recommendedSystemSize || '',
        systemType: formattedQuote.systemType || 'grid-tie',
        panelsNeeded: formattedQuote.panelsNeeded || '',
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
      resetCalculationState();
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

      // Extract IoT data from assessmentResults
      const iotData = assessment.assessmentResults || {};
      setSiteInspectionData({
        appliances: assessment.appliances || [],
        monthlyBill: assessment.monthlyBill || '',
        ratePerKwh: assessment.rate || '',
        systemType: assessment.systemType || 'grid-tie',
        roofType: assessment.roofType || ''
      });
      // Ensure all IoT fields are properly parsed with defaults
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
        totalReadings: assessment.totalReadings || iotData.totalReadings || 0,
        monthlyBill: assessment.monthlyBill || 0,
        rate: assessment.rate || 0,
        consumption: assessment.consumption || 0,
        dayConsumption: assessment.dayConsumption || 0,
        nightConsumption: assessment.nightConsumption || 0,
        dayPercentage: assessment.dayPercentage || 0,
        nightPercentage: assessment.nightPercentage || 0,
        totalDailyConsumption: assessment.totalDailyConsumption || 0,
        targetSavings: assessment.targetSavings || 0,
        recommendedSystemSize: assessment.recommendedSystemSize || null,
        inverterSize: assessment.inverterSize || null,
        batteryCapacityKwh: assessment.batteryCapacityKwh || null,
        panelsNeeded: assessment.panelsNeeded || null,
        // IoT Assessment Results
        assessmentResults: {
          peakSunHours: iotData.peakSunHours || 0,
          averageIrradiance: iotData.averageIrradiance || 0,
          maxIrradiance: iotData.maxIrradiance || 0,
          minIrradiance: iotData.minIrradiance || 0,
          averageTemperature: iotData.averageTemperature || 0,
          maxTemperature: iotData.maxTemperature || 0,
          minTemperature: iotData.minTemperature || 0,
          temperatureDerating: iotData.temperatureDerating || 0,
          averageHumidity: iotData.averageHumidity || 0,
          maxHumidity: iotData.maxHumidity || 0,
          minHumidity: iotData.minHumidity || 0,
          shadingPercentage: iotData.shadingPercentage || 0,
          gpsCoordinates: iotData.gpsCoordinates || null,
          totalReadings: iotData.totalReadings || assessment.totalReadings || 0,
          dataCollectionStart: iotData.dataCollectionStart || assessment.dataCollectionStart,
          dataCollectionEnd: iotData.dataCollectionEnd || assessment.dataCollectionEnd,
          summary: iotData.summary || {
            totalDays: 0,
            dataPointsPerDay: 0,
            siteSuitabilityScore: 0,
            recommendedSystemSize: 0,
            estimatedAnnualProduction: 0,
            estimatedAnnualSavings: 0
          }
        }
      };

      setSelectedItem(formattedAssessment);
      setSelectedType('pre_assessment');

      // Initialize calculation data with the formatted assessment
      calculation.initializeFromData(formattedAssessment);

      // If IoT data has peakSunHours, set PSH from it
      if (iotData.peakSunHours && iotData.peakSunHours > 0) {
        calculation.setPshFromIoT(iotData.peakSunHours);
      }

      // Set assessment results for display
      setAssessmentResults(iotData);

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
          systemSize: formattedAssessment.recommendedSystemSize || '',
          systemType: formattedAssessment.systemType || 'grid-tie',
          panelsNeeded: formattedAssessment.panelsNeeded || '',
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

      await fetchSystemRecommendations(assessmentId);

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
    const annualProduction = isFreeQuote
      ? calculation.calculationResults.estimatedAnnualProduction || 0
      : calculation.calculationResults.estimatedAnnualProduction || 0;
    const co2Offset = isFreeQuote
      ? calculation.calculationResults.co2Offset || 0
      : calculation.calculationResults.co2Offset || 0;

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

      // Calculate ROI years
      const roiYears = annualProduction > 0 ? Number((totalCost / annualProduction).toFixed(1)) : 0;

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
        annualProduction: annualProduction,
        co2Offset: co2Offset,
        roiYears: roiYears,
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
        annualProduction: annualProduction,
        co2Offset: co2Offset,
        roiYears: roiYears,
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
    return !!(item.iotDeviceId || item.assignedDevice || item.assignedDeviceId);
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
  const resetCalculationState = () => {
    calculation.setShowCalculationCards(true);
    calculation.setShowEquipmentSelection(false);
    calculation.setHasCalculated(false);
    calculation.setSelectedCalculationMethod(null);
    calculation.resetCalculationCards();
  };
  // Update handleSelectItem
  const handleSelectItem = (item) => {
    resetCalculationState();

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
    setCurrentPage(1);
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

  // Pagination calculations
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = filteredAssessments.slice(indexOfFirstRow, indexOfLastRow);
  const totalPages = Math.ceil(filteredAssessments.length / rowsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);
  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Get unique statuses for dropdown
  // NEW CODE - Gets statuses from ALL assessments
  const getUniqueStatuses = () => {
    const statuses = new Set();
    allAssessments.forEach(item => {
      const status = item.type === 'free_quote' ? item.status : item.assessmentStatus;
      if (status) statuses.add(status);
    });
    return Array.from(statuses);
  };

  // Skeleton Loader Components
  const SkeletonCard = () => (
    <tr className="skeleton-row-enad">
      <td><div className="skeleton-cell-enad"></div></td>
      <td><div className="skeleton-cell-enad"></div></td>
      <td><div className="skeleton-cell-enad"></div></td>
      <td><div className="skeleton-cell-enad"></div></td>
      <td><div className="skeleton-cell-enad"></div></td>
      <td><div className="skeleton-cell-enad"></div></td>
      <td><div className="skeleton-cell-enad"></div></td>
    </tr>
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
      </div>
      <div className="assessments-table-container-enad">
        <table className="assessments-table-enad">
          <thead>
            <tr>
              <th>Reference</th>
              <th>Client</th>
              <th>Type</th>
              <th>Status</th>
              <th>Address</th>
              <th>Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map(i => <SkeletonCard key={i} />)}
          </tbody>
        </table>
      </div>
    </div>
  );

  if (loading && allAssessments.length === 0) {
    return <SkeletonList />;
  }

  // Assessment List View with Table
  if (!selectedItem) {
    const uniqueStatuses = getUniqueStatuses();

    return (
      <>
        <Helmet><title>My Assessments | Engineer | SOLARIS</title></Helmet>
        {/* ADD THIS - Toast Notification at the top level */}
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position="bottom-left"
        />
        <div className="my-assessments-enad">


          <div className="search-bar-enad">
            <input
              type="text"
              placeholder="Search by reference or client name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="assessment-search-input-enad"
            />
          </div>

          <div className="filter-controls-enad">
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

            <div className="status-filter-dropdown-enad">
              <select
                className="status-filter-select-enad"
                value={activeStatusFilter}
                onChange={(e) => setActiveStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                {getUniqueStatuses().map(status => {
                  // First check PRE_ASSESSMENT_STATUS, then FREE_QUOTE_STATUS
                  const statusConfig = PRE_ASSESSMENT_STATUS[status] || FREE_QUOTE_STATUS[status] || { label: status?.replace(/_/g, ' ') };
                  return (
                    <option key={status} value={status}>
                      {statusConfig.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {error && <div className="error-container-enad"><span>{error}</span></div>}

          {filteredAssessments.length === 0 ? (
            <div className="empty-state-enad">
              <h3>No assessments found</h3>
              <p>{allAssessments.length === 0 ? "You don't have any assessments assigned yet." : "No assessments match your search criteria."}</p>
            </div>
          ) : (
            <>
              <div className="assessments-table-container-enad">
                <table className="assessments-table-enad">
                  <thead>
                    <tr>
                      <th>Reference</th>
                      <th>Client</th>
                      <th>Type</th>
                      <th>Status</th>
                      <th>Address</th>
                      <th>Date</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentRows.map((item) => {
                      const StatusConfig = getStatusConfig(item);
                      const TypeConfig = getTypeConfig(item.type);
                      return (
                        <tr key={`${item.type}-${item.id}`} className="assessment-table-row-enad" onClick={() => handleSelectItem(item)}>
                          <td className="ref-cell-enad">
                            <span className="ref-text-enad">{item.bookingReference || item.quotationReference}</span>
                          </td>
                          <td className="client-cell-enad">
                            <div className="client-info-enad">
                              <span className="client-name-enad">{item.clientName} {item.clientLastName}</span>
                              <span className="client-type-enad">{item.clientType || 'Residential'}</span>
                            </div>
                          </td>
                          <td className="type-cell-enad">
                            <span className={`type-badge-enad ${TypeConfig.color}`}>{TypeConfig.label}</span>
                          </td>
                          <td className="status-cell-enad">
                            <span className={`status-badge-enad ${StatusConfig.color}`}>{StatusConfig.label}</span>
                          </td>
                          <td className="address-cell-enad">
                            <span className="address-text-enad" title={getFullAddress(item.address)}>
                              {getFullAddress(item.address)}
                            </span>
                          </td>
                          <td className="date-cell-enad">
                            {formatDate(item.siteVisitDate || item.requestedAt)}
                          </td>
                          <td className="actions-cell-enad">
                            <button className="view-btn-enad" onClick={(e) => { e.stopPropagation(); handleSelectItem(item); }}>
                              View
                            </button>
                            {item.type === 'pre_assessment' && hasDeviceAssigned(item) && (
                              <span className="device-indicator-enad" title="Device Assigned"></span>
                            )}
                            {item.type === 'free_quote' && item.quotationFile && (
                              <span className="quotation-indicator-enad" title="Quotation Ready"></span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="pagination-enad">
                  <button
                    className={`pagination-btn-enad ${currentPage === 1 ? 'disabled-enad' : ''}`}
                    onClick={prevPage}
                    disabled={currentPage === 1}
                  >
                    Previous
                  </button>

                  <div className="pagination-numbers-enad">
                    {[...Array(totalPages).keys()].map(number => (
                      <button
                        key={number + 1}
                        className={`pagination-number-enad ${currentPage === number + 1 ? 'active-enad' : ''}`}
                        onClick={() => paginate(number + 1)}
                      >
                        {number + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    className={`pagination-btn-enad ${currentPage === totalPages ? 'disabled-enad' : ''}`}
                    onClick={nextPage}
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </button>
                </div>
              )}

              <div className="pagination-info-enad">
                Showing {indexOfFirstRow + 1} to {Math.min(indexOfLastRow, filteredAssessments.length)} of {filteredAssessments.length} assessments
              </div>
            </>
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
        <ToastNotification
          show={toast.show}
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
          position="bottom-left"
        />
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
                    <div className="client-meta-item-enad">{getFullAddress(selectedItem.address) || 'No address'}</div>
                  </div>
                </div>
                <div className={`status-badge-enad ${StatusConfig.color}`}>{StatusConfig.label}</div>
              </div>

              {/* System Calculations from Database */}
              {selectedItem.recommendedSystemSize && (
                <div className="system-recommendations">
                  <h4>System Size Calculations (from your energy profile)</h4>
                  <div className="recommendations-grid">
                    <div className="rec-item">
                      <label>Recommended System Size</label>
                      <strong>{selectedItem.recommendedSystemSize} kWp</strong>
                    </div>
                    {selectedItem.systemType !== 'grid-tie' && selectedItem.batteryCapacityKwh > 0 && (
                      <div className="rec-item">
                        <label>Battery Size</label>
                        <strong>{selectedItem.batteryCapacityKwh} kWh</strong>
                      </div>
                    )}
                    <div className="rec-item">
                      <label>Inverter Size</label>
                      <strong>{selectedItem.inverterSize} kW</strong>
                    </div>
                    <div className="rec-item">
                      <label>Total Daily Consumption</label>
                      <strong>{selectedItem.totalDailyConsumption?.toFixed(2) || 0} kWh/day</strong>
                    </div>
                    <div className="rec-item">
                      <label>Day/Night Usage</label>
                      <strong>{selectedItem.dayPercentage?.toFixed(0) || 0}% / {selectedItem.nightPercentage?.toFixed(0) || 0}%</strong>
                    </div>
                    {selectedItem.targetSavings && (
                      <div className="rec-item">
                        <label>Target Savings</label>
                        <strong>{selectedItem.targetSavings}%</strong>
                      </div>
                    )}
                    <div className="rec-item">
                      <label>System Type</label>
                      <strong>{getSystemTypeLabel(selectedItem.systemType)}</strong>
                    </div>

                    {/* Annual Production Estimates */}
                    {selectedItem.estimatedAnnualProduction && (
                      <>
                        <div className="rec-item">
                          <label>Annual Production (Actual)</label>
                          <strong>{selectedItem.estimatedAnnualProduction.toLocaleString()} kWh/year</strong>
                        </div>
                        {selectedItem.estimatedAnnualProductionMin && selectedItem.estimatedAnnualProductionMax && (
                          <div className="rec-item">
                            <label>Annual Production Range</label>
                            <strong>
                              {selectedItem.estimatedAnnualProductionMin.toLocaleString()} - {selectedItem.estimatedAnnualProductionMax.toLocaleString()} kWh/year
                            </strong>
                            <small className="form-hint-enad">3-4.5 PSH range</small>
                          </div>
                        )}
                      </>
                    )}

                    {/* CO2 Offset Estimates */}
                    {selectedItem.co2Offset && (
                      <>
                        <div className="rec-item">
                          <label>CO2 Offset (Actual)</label>
                          <strong>{selectedItem.co2Offset.toLocaleString()} kg/year</strong>
                        </div>
                        {selectedItem.co2OffsetMin && selectedItem.co2OffsetMax && (
                          <div className="rec-item">
                            <label>CO2 Offset Range</label>
                            <strong>
                              {selectedItem.co2OffsetMin.toLocaleString()} - {selectedItem.co2OffsetMax.toLocaleString()} kg/year
                            </strong>
                            <small className="form-hint-enad">3-4.5 PSH range</small>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              )}

              <div className="detail-section-enad">
                {/* Basic Information */}
                <div className="quotation-section">
                  <h4>Basic Information</h4>
                  <div className="form-grid-enad">
                    <div className="form-group-enad">
                      <label className="form-label-enad">Quotation Number</label>
                      <div className="assessment-form-input-enad">{freeQuoteForm.quotationNumber}</div>
                    </div>
                    <div className="form-group-enad">
                      <label className="form-label-enad">Expiry Date</label>
                      <div className="assessment-form-input-enad">{formatDate(freeQuoteForm.quotationExpiryDate)}</div>
                      <small className="form-hint-enad">Automatically set to 30 days from today</small>
                    </div>
                    <div className="form-group-enad">
                      <label className="form-label-enad">System Type</label>
                      <div className="assessment-form-input-enad">{getSystemTypeLabel(freeQuoteForm.systemType)}</div>
                    </div>
                  </div>
                </div>

                {/* ===== CALCULATION CARDS SECTION ===== */}
                {calculation.showCalculationCards && (
                  <div className="calculation-cards-container">
                    <div className="calculation-cards-header">
                      <h3>System Size Calculation</h3>
                      <p>Select a calculation method to determine the optimal system size</p>
                      <div className="system-type-indicator">
                        <span>System Type: </span>
                        <strong>{getSystemTypeLabel(freeQuoteForm.systemType)}</strong>
                      </div>
                    </div>

                    <div className="calculation-cards-grid">
                      {/* Based on Area - Show for Grid-Tie and Off-Grid */}
                      {(freeQuoteForm.systemType === 'grid-tie' || freeQuoteForm.systemType === 'off-grid') && (
                        <AreaCalculationCard
                          roofLength={calculation.roofLength}
                          roofWidth={calculation.roofWidth}
                          roofArea={calculation.roofArea}
                          selectedPanelForCalc={calculation.selectedPanelForCalc}
                          setSelectedPanelForCalc={calculation.setSelectedPanelForCalc}
                          availablePanels={availablePanels}
                          calculateByArea={() => calculation.calculateByArea(freeQuoteForm.systemType)}
                          isDataLoaded={calculation.isDataLoaded}
                          showToast={showToast}
                        />
                      )}

                      {/* Based on Electricity - Show for all system types */}
                      <ElectricityCalculationCard
                        totalDailyConsumption={calculation.totalDailyConsumption}
                        dayConsumption={calculation.dayConsumption}
                        nightConsumption={calculation.nightConsumption}
                        ratePerKwh={calculation.ratePerKwh}
                        monthlyBill={calculation.monthlyBill}
                        pshValue={calculation.pshValue}
                        setPshValue={calculation.setPshValue}
                        targetSavings={calculation.targetSavings}
                        selectedPanelForCalc={calculation.selectedPanelForCalc}
                        setSelectedPanelForCalc={calculation.setSelectedPanelForCalc}
                        availablePanels={availablePanels}
                        calculateByElectricity={() => calculation.calculateByElectricity(freeQuoteForm.systemType)}
                        isDataLoaded={calculation.isDataLoaded}
                        selectedBatteryForCalc={calculation.selectedBatteryForCalc}
                        batteryAutonomy={calculation.batteryAutonomy}
                        setBatteryAutonomy={calculation.setBatteryAutonomy}
                        showToast={showToast}
                      />

                      {/* Based on Net Metering - Show for Grid-Tie only */}
                      {freeQuoteForm.systemType === 'grid-tie' && (
                        <NetMeteringCalculationCard
                          dayConsumption={calculation.dayConsumption}
                          nightConsumption={calculation.nightConsumption}
                          dayPvCapacity={calculation.dayPvCapacity}
                          nightPvCapacity={calculation.nightPvCapacity}
                          totalPvCapacity={calculation.totalPvCapacity}
                          selectedPanelForCalc={calculation.selectedPanelForCalc}
                          setSelectedPanelForCalc={calculation.setSelectedPanelForCalc}
                          availablePanels={availablePanels}
                          calculateByNetMetering={calculation.calculateByNetMetering}
                          isDataLoaded={calculation.isDataLoaded}
                          targetSavings={calculation.targetSavings}
                          showToast={showToast}
                        />
                      )}
                    </div>

                    {/* Show results if calculated */}
                    {calculation.hasCalculated && calculation.calculationResults.recommendedSystemSize > 0 && (
                      <CalculationResultsCard
                        calculationResults={calculation.calculationResults}
                        selectedCalculationMethod={calculation.selectedCalculationMethod}
                        applyCalculationResults={() => calculation.applyCalculationResults(
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
                        )}
                        resetCalculationCards={calculation.resetCalculationCards}
                        showToast={showToast}
                      />
                    )}
                  </div>
                )}

                {/* ===== EQUIPMENT SELECTION ===== */}
                {calculation.showEquipmentSelection && (
                  <>
                    {/* Show calculated results summary */}
                    {calculation.calculationResults.recommendedSystemSize > 0 && (
                      <div className="calculated-results-summary">
                        <h4>System Summary</h4>
                        <div className="summary-grid">
                          <div className="summary-item">
                            <label>System Size</label>
                            <strong>{calculation.calculationResults.recommendedSystemSize} kWp</strong>
                          </div>
                          <div className="summary-item">
                            <label>Inverter Size</label>
                            <strong>{calculation.calculationResults.inverterSize} kW</strong>
                          </div>
                          <div className="summary-item">
                            <label>Panels Needed</label>
                            <strong>{calculation.calculationResults.panelsNeeded} pcs</strong>
                          </div>
                          {calculation.calculationResults.batteryCapacityKwh > 0 && (
                            <div className="summary-item">
                              <label>Battery Capacity</label>
                              <strong>{calculation.calculationResults.batteryCapacityKwh} kWh</strong>
                            </div>
                          )}
                          <div className="summary-item">
                            <label>Annual Production</label>
                            <strong>{calculation.calculationResults.estimatedAnnualProduction?.toLocaleString() || 0} kWh/yr</strong>
                          </div>
                          <div className="summary-item">
                            <label>CO₂ Offset</label>
                            <strong>{calculation.calculationResults.co2Offset?.toLocaleString() || 0} kg/yr</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    <SystemEquipmentSelection
                      showToast={showToast}
                      availablePanels={availablePanels}
                      freeQuoteSelectedPanel={freeQuoteSelectedPanel}
                      setFreeQuoteSelectedPanel={setFreeQuoteSelectedPanel}
                      freeQuotePanelQuantity={freeQuotePanelQuantity}
                      setFreeQuotePanelQuantity={setFreeQuotePanelQuantity}
                      freeQuoteCalculatedCosts={freeQuoteCalculatedCosts}
                      availableInverters={availableInverters}
                      freeQuoteSelectedInverter={freeQuoteSelectedInverter}
                      setFreeQuoteSelectedInverter={setFreeQuoteSelectedInverter}
                      freeQuoteInverterQuantity={freeQuoteInverterQuantity}
                      setFreeQuoteInverterQuantity={setFreeQuoteInverterQuantity}
                      availableBatteries={availableBatteries}
                      freeQuoteSelectedBattery={freeQuoteSelectedBattery}
                      setFreeQuoteSelectedBattery={setFreeQuoteSelectedBattery}
                      freeQuoteBatteryQuantity={freeQuoteBatteryQuantity}
                      setFreeQuoteBatteryQuantity={setFreeQuoteBatteryQuantity}
                      availableMountingStructures={availableMountingStructures}
                      freeQuoteSelectedMountingStructure={freeQuoteSelectedMountingStructure}
                      setFreeQuoteSelectedMountingStructure={setFreeQuoteSelectedMountingStructure}
                      freeQuoteMountingStructureQuantity={freeQuoteMountingStructureQuantity}
                      setFreeQuoteMountingStructureQuantity={setFreeQuoteMountingStructureQuantity}
                      availableElectricalComponents={availableElectricalComponents}
                      freeQuoteSelectedElectricalComponents={freeQuoteSelectedElectricalComponents}
                      freeQuoteAddElectricalComponent={freeQuoteAddElectricalComponent}
                      freeQuoteUpdateElectricalComponent={freeQuoteUpdateElectricalComponent}
                      freeQuoteRemoveElectricalComponent={freeQuoteRemoveElectricalComponent}
                      availableCables={availableCables}
                      freeQuoteSelectedCables={freeQuoteSelectedCables}
                      freeQuoteAddCable={freeQuoteAddCable}
                      freeQuoteUpdateCable={freeQuoteUpdateCable}
                      freeQuoteRemoveCable={freeQuoteRemoveCable}
                      availableJunctionBoxes={availableJunctionBoxes}
                      freeQuoteSelectedJunctionBoxes={freeQuoteSelectedJunctionBoxes}
                      freeQuoteAddJunctionBox={freeQuoteAddJunctionBox}
                      freeQuoteUpdateJunctionBox={freeQuoteUpdateJunctionBox}
                      freeQuoteRemoveJunctionBox={freeQuoteRemoveJunctionBox}
                      availableDisconnectSwitches={availableDisconnectSwitches}
                      freeQuoteSelectedDisconnectSwitches={freeQuoteSelectedDisconnectSwitches}
                      freeQuoteAddDisconnectSwitch={freeQuoteAddDisconnectSwitch}
                      freeQuoteUpdateDisconnectSwitch={freeQuoteUpdateDisconnectSwitch}
                      freeQuoteRemoveDisconnectSwitch={freeQuoteRemoveDisconnectSwitch}
                      availableMeters={availableMeters}
                      freeQuoteSelectedMeters={freeQuoteSelectedMeters}
                      freeQuoteAddMeter={freeQuoteAddMeter}
                      freeQuoteUpdateMeter={freeQuoteUpdateMeter}
                      freeQuoteRemoveMeter={freeQuoteRemoveMeter}
                      freeQuoteAdditionalEquipment={freeQuoteAdditionalEquipment}
                      freeQuoteAddAdditionalEquipment={freeQuoteAddAdditionalEquipment}
                      freeQuoteUpdateAdditionalEquipment={freeQuoteUpdateAdditionalEquipment}
                      freeQuoteRemoveAdditionalEquipment={freeQuoteRemoveAdditionalEquipment}
                      laborCostPercentage={laborCostPercentage}
                      setLaborCostPercentage={setLaborCostPercentage}
                      overheadContingencyPercentage={overheadContingencyPercentage}
                      setOverheadContingencyPercentage={setOverheadContingencyPercentage}
                      contractorProfitPercentage={contractorProfitPercentage}
                      setContractorProfitPercentage={setContractorProfitPercentage}
                      freeQuoteCalculateTotalCosts={freeQuoteCalculateTotalCosts}
                      freeQuoteForm={freeQuoteForm}
                      handleFreeQuoteFormChange={handleFreeQuoteFormChange}
                      systemType={freeQuoteForm.systemType}
                      getSystemTypeLabel={getSystemTypeLabel}
                      formatCurrency={formatCurrency}
                      generateQuotationPDF={generateQuotationPDF}
                      generatingPDF={generatingPDF}
                      annualProduction={calculation.calculationResults.estimatedAnnualProduction || 0}
                    />
                  </>
                )}

                {/* Show equipment if already selected (fallback) */}
                {!calculation.showCalculationCards && !calculation.showEquipmentSelection && (
                  <>
                    {/* Keep the existing equipment selection code here as fallback */}
                    {/* ... existing equipment selection code ... */}
                  </>
                )}
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
      <ToastNotification
        show={toast.show}
        message={toast.message}
        type={toast.type}
        onClose={hideToast}
        position="bottom-left"
      />
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
              <button onClick={() => setActiveTab('overview')} className={`tab-btn-enad ${activeTab === 'overview' ? 'active-enad' : ''}`}>Overview</button>
              <button onClick={() => setActiveTab('site-inspection')} className={`tab-btn-enad ${activeTab === 'site-inspection' ? 'active-enad' : ''}`}>Site Inspection</button>
              <button onClick={() => setActiveTab('quotation')} className={`tab-btn-enad ${activeTab === 'quotation' ? 'active-enad' : ''}`}>Quotation</button>
              <button onClick={() => setActiveTab('documents')} className={`tab-btn-enad ${activeTab === 'documents' ? 'active-enad' : ''}`}>Documents</button>
              <button onClick={() => setActiveTab('comments')} className={`tab-btn-enad ${activeTab === 'comments' ? 'active-enad' : ''}`}>Comments</button>
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
                          <span className="roof-area-text">({calculateRoofArea(selectedItem.roofLength, selectedItem.roofWidth)} m²)</span>
                        )}
                      </span>
                    </div>
                  )}

                  <div className="info-item-enad"><span className="info-label-enad">Monthly Bill</span><span className="info-value-enad">{formatCurrency(selectedItem.monthlyBill || 0)}</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Monthly Consumption</span><span className="info-value-enad">{selectedItem.consumption || 0} kWh</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Rate per kWh</span><span className="info-value-enad">₱{(selectedItem.rate || 0).toFixed(2)}</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Day Consumption</span><span className="info-value-enad">{selectedItem.dayConsumption?.toFixed(2) || 0} kWh</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Night Consumption</span><span className="info-value-enad">{selectedItem.nightConsumption?.toFixed(2) || 0} kWh</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Day/Night Usage</span><span className="info-value-enad">{selectedItem.dayPercentage || 0}% / {selectedItem.nightPercentage || 0}%</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Total Daily Consumption</span><span className="info-value-enad">{selectedItem.totalDailyConsumption || 0} kWh/day</span></div>
                  {selectedItem.targetSavings && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Target Savings</span>
                      <span className="info-value-enad">{selectedItem.targetSavings}%</span>
                    </div>
                  )}
                  {selectedItem.recommendedSystemSize && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Recommended System Size</span>
                      <span className="info-value-enad">{selectedItem.recommendedSystemSize} kWp</span>
                    </div>
                  )}
                  {selectedItem.inverterSize && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Inverter Size</span>
                      <span className="info-value-enad">{selectedItem.inverterSize} kW</span>
                    </div>
                  )}
                  {selectedItem.batteryCapacityKwh > 0 && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Battery Capacity</span>
                      <span className="info-value-enad">{selectedItem.batteryCapacityKwh} kWh</span>
                    </div>
                  )}
                  {selectedItem.panelsNeeded && (
                    <div className="info-item-enad">
                      <span className="info-label-enad">Panels Needed</span>
                      <span className="info-value-enad">{selectedItem.panelsNeeded} panels</span>
                    </div>
                  )}
                  <div className="info-item-enad"><span className="info-label-enad">Booked Date</span><span className="info-value-enad">{formatDate(selectedItem.bookedAt)}</span></div>

                  {selectedItem.siteVisitDate && <div className="info-item-enad"><span className="info-label-enad">Site Visit Date</span><span className="info-value-enad">{formatDate(selectedItem.siteVisitDate)}</span></div>}
                  {selectedItem.deviceDeployedAt && <div className="info-item-enad"><span className="info-label-enad">Device Deployed</span><span className="info-value-enad">{formatDateTime(selectedItem.deviceDeployedAt)}</span></div>}
                  {selectedItem.dataCollectionStart && <div className="info-item-enad"><span className="info-label-enad">Data Collection Start</span><span className="info-value-enad">{formatDateTime(selectedItem.dataCollectionStart)}</span></div>}
                  {selectedItem.dataCollectionEnd && <div className="info-item-enad"><span className="info-label-enad">Data Collection End</span><span className="info-value-enad">{formatDateTime(selectedItem.dataCollectionEnd)}</span></div>}
                  {selectedItem.totalReadings > 0 && <div className="info-item-enad"><span className="info-label-enad">Total Readings</span><span className="info-value-enad">{selectedItem.totalReadings}</span></div>}
                  <div className="info-item-enad"><span className="info-label-enad">Assessment Fee</span><span className="info-value-enad">{formatCurrency(selectedItem.assessmentFee)}</span></div>
                  <div className="info-item-enad"><span className="info-label-enad">Payment Status</span><span className="info-value-enad">{selectedItem.paymentStatus === 'paid' ? 'Completed' : 'Pending'}</span></div>
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
              <SiteInspectionTab
                // Assessment form data
                assessmentForm={assessmentForm}
                onAssessmentFormChange={handleAssessmentFormChange}

                // Site inspection data
                siteInspectionData={siteInspectionData}
                onSiteInspectionDataChange={(field, value) => {
                  setSiteInspectionData(prev => ({ ...prev, [field]: value }));
                }}

                // Device and status props
                deviceAssigned={deviceAssigned}
                assessmentStatus={selectedItem?.assessmentStatus}
                deployNotes={deployNotes}
                onDeployNotesChange={setDeployNotes}

                // Actions
                onSave={saveSiteInspectionData}
                onDeploy={openDeployConfirmModal}
                isSubmitting={submitting}

                // Constants
                ROOF_CONDITIONS={ROOF_CONDITIONS}
                STRUCTURAL_INTEGRITY={STRUCTURAL_INTEGRITY}

                // ✅ ENERGY PROFILE DATA
                appliances={selectedItem?.appliances || []}
                initialCalculationResults={{
                  totalDailyConsumption: selectedItem?.totalDailyConsumption || 0,
                  dayConsumption: selectedItem?.dayConsumption || 0,
                  nightConsumption: selectedItem?.nightConsumption || 0,
                  dayPercentage: selectedItem?.dayPercentage || 0,
                  nightPercentage: selectedItem?.nightPercentage || 0,
                  monthlyConsumption: selectedItem?.consumption || 0
                }}
              />
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
                    <input type="checkbox" checked={includeIoTData} onChange={(e) => setIncludeIoTData(e.target.checked)} />
                    Include IoT Data Analysis in PDF
                  </label>
                  {selectedItem.dataCollectionStart && selectedItem.dataCollectionEnd && (
                    <small className="form-hint-enad">IoT data collected from {formatDateTime(selectedItem.dataCollectionStart)} to {formatDateTime(selectedItem.dataCollectionEnd)}</small>
                  )}
                </div>

                {/* IoT Monitoring Results - Show always */}
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

                {/* ===== CALCULATION CARDS SECTION ===== */}
                {calculation.showCalculationCards && (
                  <div className="calculation-cards-container">
                    <div className="calculation-cards-header">
                      <h3>System Size Calculation</h3>
                      <p>Select a calculation method to determine the optimal system size</p>
                      <div className="system-type-indicator">
                        <span>System Type: </span>
                        <strong>{getSystemTypeLabel(selectedItem.systemType || 'grid-tie')}</strong>
                      </div>
                    </div>

                    <div className="calculation-cards-grid">
                      {/* Based on Area - Show for Grid-Tie and Off-Grid */}
                      {(selectedItem.systemType === 'grid-tie' || selectedItem.systemType === 'off-grid') && (
                        <AreaCalculationCard
                          roofLength={calculation.roofLength}
                          roofWidth={calculation.roofWidth}
                          roofArea={calculation.roofArea}
                          selectedPanelForCalc={calculation.selectedPanelForCalc}
                          setSelectedPanelForCalc={calculation.setSelectedPanelForCalc}
                          availablePanels={availablePanels}
                          calculateByArea={() => calculation.calculateByArea(selectedItem.systemType || 'grid-tie')}
                          isDataLoaded={calculation.isDataLoaded}
                          showToast={showToast}
                        />
                      )}

                      {/* Based on Electricity - Show for all system types */}
                      <ElectricityCalculationCard
                        totalDailyConsumption={calculation.totalDailyConsumption}
                        dayConsumption={calculation.dayConsumption}
                        nightConsumption={calculation.nightConsumption}
                        ratePerKwh={calculation.ratePerKwh}
                        monthlyBill={calculation.monthlyBill}
                        pshValue={calculation.pshValue}
                        setPshValue={calculation.setPshValue}
                        targetSavings={calculation.targetSavings}
                        selectedPanelForCalc={calculation.selectedPanelForCalc}
                        setSelectedPanelForCalc={calculation.setSelectedPanelForCalc}
                        availablePanels={availablePanels}
                        calculateByElectricity={() => calculation.calculateByElectricity(selectedItem.systemType || 'grid-tie')}
                        isDataLoaded={calculation.isDataLoaded}
                        selectedBatteryForCalc={calculation.selectedBatteryForCalc}
                        batteryAutonomy={calculation.batteryAutonomy}
                        setBatteryAutonomy={calculation.setBatteryAutonomy}
                        systemType={selectedItem.systemType || 'grid-tie'}
                        showToast={showToast}
                      />

                      {/* Based on Net Metering - Show for Grid-Tie only */}
                      {selectedItem.systemType === 'grid-tie' && (
                        <NetMeteringCalculationCard
                          dayConsumption={calculation.dayConsumption}
                          nightConsumption={calculation.nightConsumption}
                          dayPvCapacity={calculation.dayPvCapacity}
                          nightPvCapacity={calculation.nightPvCapacity}
                          totalPvCapacity={calculation.totalPvCapacity}
                          selectedPanelForCalc={calculation.selectedPanelForCalc}
                          setSelectedPanelForCalc={calculation.setSelectedPanelForCalc}
                          availablePanels={availablePanels}
                          calculateByNetMetering={calculation.calculateByNetMetering}
                          isDataLoaded={calculation.isDataLoaded}
                          targetSavings={calculation.targetSavings}
                          showToast={showToast}
                        />
                      )}
                    </div>

                    {/* Show results if calculated */}
                    {calculation.hasCalculated && calculation.calculationResults.recommendedSystemSize > 0 && (
                      <CalculationResultsCard
                        calculationResults={calculation.calculationResults}
                        selectedCalculationMethod={calculation.selectedCalculationMethod}
                        applyCalculationResults={() => calculation.applyCalculationResults(
                          setQuotationForm,
                          setSelectedPanel,
                          setPanelQuantity,
                          setSelectedInverter,
                          setInverterQuantity,
                          setSelectedBattery,
                          setBatteryQuantity,
                          availablePanels,
                          availableInverters,
                          availableBatteries,
                          showToast
                        )}
                        resetCalculationCards={calculation.resetCalculationCards}
                        systemType={selectedItem.systemType || 'grid-tie'}
                        showToast={showToast}
                      />
                    )}
                  </div>
                )}

                {/* ===== EQUIPMENT SELECTION ===== */}
                {calculation.showEquipmentSelection && (
                  <>
                    {/* Show calculated results summary */}
                    {calculation.calculationResults.recommendedSystemSize > 0 && (
                      <div className="calculated-results-summary">
                        <h4>System Summary</h4>
                        <div className="summary-grid">
                          <div className="summary-item">
                            <label>System Size</label>
                            <strong>{calculation.calculationResults.recommendedSystemSize} kWp</strong>
                          </div>
                          <div className="summary-item">
                            <label>Inverter Size</label>
                            <strong>{calculation.calculationResults.inverterSize} kW</strong>
                          </div>
                          <div className="summary-item">
                            <label>Panels Needed</label>
                            <strong>{calculation.calculationResults.panelsNeeded} pcs</strong>
                          </div>
                          {calculation.calculationResults.batteryCapacityKwh > 0 && (
                            <div className="summary-item">
                              <label>Battery Capacity</label>
                              <strong>{calculation.calculationResults.batteryCapacityKwh} kWh</strong>
                            </div>
                          )}
                          <div className="summary-item">
                            <label>Annual Production</label>
                            <strong>{calculation.calculationResults.estimatedAnnualProduction?.toLocaleString() || 0} kWh/yr</strong>
                          </div>
                          <div className="summary-item">
                            <label>CO₂ Offset</label>
                            <strong>{calculation.calculationResults.co2Offset?.toLocaleString() || 0} kg/yr</strong>
                          </div>
                        </div>
                      </div>
                    )}

                    <SystemEquipmentSelection
                      showToast={showToast}
                      availablePanels={availablePanels}
                      freeQuoteSelectedPanel={selectedPanel}
                      setFreeQuoteSelectedPanel={setSelectedPanel}
                      freeQuotePanelQuantity={panelQuantity}
                      setFreeQuotePanelQuantity={setPanelQuantity}
                      freeQuoteCalculatedCosts={calculatedCosts}
                      availableInverters={availableInverters}
                      freeQuoteSelectedInverter={selectedInverter}
                      setFreeQuoteSelectedInverter={setSelectedInverter}
                      freeQuoteInverterQuantity={inverterQuantity}
                      setFreeQuoteInverterQuantity={setInverterQuantity}
                      availableBatteries={availableBatteries}
                      freeQuoteSelectedBattery={selectedBattery}
                      setFreeQuoteSelectedBattery={setSelectedBattery}
                      freeQuoteBatteryQuantity={batteryQuantity}
                      setFreeQuoteBatteryQuantity={setBatteryQuantity}
                      availableMountingStructures={availableMountingStructures}
                      freeQuoteSelectedMountingStructure={selectedMountingStructure}
                      setFreeQuoteSelectedMountingStructure={setSelectedMountingStructure}
                      freeQuoteMountingStructureQuantity={mountingStructureQuantity}
                      setFreeQuoteMountingStructureQuantity={setMountingStructureQuantity}
                      availableElectricalComponents={availableElectricalComponents}
                      freeQuoteSelectedElectricalComponents={selectedElectricalComponents}
                      freeQuoteAddElectricalComponent={addElectricalComponent}
                      freeQuoteUpdateElectricalComponent={updateElectricalComponent}
                      freeQuoteRemoveElectricalComponent={removeElectricalComponent}
                      availableCables={availableCables}
                      freeQuoteSelectedCables={selectedCables}
                      freeQuoteAddCable={addCable}
                      freeQuoteUpdateCable={updateCable}
                      freeQuoteRemoveCable={removeCable}
                      availableJunctionBoxes={availableJunctionBoxes}
                      freeQuoteSelectedJunctionBoxes={selectedJunctionBoxes}
                      freeQuoteAddJunctionBox={addJunctionBox}
                      freeQuoteUpdateJunctionBox={updateJunctionBox}
                      freeQuoteRemoveJunctionBox={removeJunctionBox}
                      availableDisconnectSwitches={availableDisconnectSwitches}
                      freeQuoteSelectedDisconnectSwitches={selectedDisconnectSwitches}
                      freeQuoteAddDisconnectSwitch={addDisconnectSwitch}
                      freeQuoteUpdateDisconnectSwitch={updateDisconnectSwitch}
                      freeQuoteRemoveDisconnectSwitch={removeDisconnectSwitch}
                      availableMeters={availableMeters}
                      freeQuoteSelectedMeters={selectedMeters}
                      freeQuoteAddMeter={addMeter}
                      freeQuoteUpdateMeter={updateMeter}
                      freeQuoteRemoveMeter={removeMeter}
                      freeQuoteAdditionalEquipment={additionalEquipment}
                      freeQuoteAddAdditionalEquipment={addAdditionalEquipment}
                      freeQuoteUpdateAdditionalEquipment={updateAdditionalEquipment}
                      freeQuoteRemoveAdditionalEquipment={removeAdditionalEquipment}
                      laborCostPercentage={laborCostPercentage}
                      setLaborCostPercentage={setLaborCostPercentage}
                      overheadContingencyPercentage={overheadContingencyPercentage}
                      setOverheadContingencyPercentage={setOverheadContingencyPercentage}
                      contractorProfitPercentage={contractorProfitPercentage}
                      setContractorProfitPercentage={setContractorProfitPercentage}
                      freeQuoteCalculateTotalCosts={calculateTotalCosts}
                      freeQuoteForm={quotationForm}
                      handleFreeQuoteFormChange={handleQuotationChange}
                      systemType={selectedItem.systemType || 'grid-tie'}
                      getSystemTypeLabel={getSystemTypeLabel}
                      formatCurrency={formatCurrency}
                      generateQuotationPDF={generateQuotationPDF}
                      generatingPDF={generatingPDF}
                      annualProduction={calculation.calculationResults.estimatedAnnualProduction || 0}
                    />
                  </>
                )}

                {/* Show existing equipment if already selected (fallback) */}
                {!calculation.showCalculationCards && !calculation.showEquipmentSelection && (
                  <>
                    {/* Keep the existing equipment selection code from the original file */}
                    {/* ... existing equipment selection code ... */}
                  </>
                )}
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
                  <span className="detail-value-enad">Assigned ✓</span>
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