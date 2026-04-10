import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import axios from 'axios';
import {
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaUser,
  FaFileAlt,
  FaUpload,
  FaCheckCircle,
  FaClock,
  FaCamera,
  FaDownload,
  FaEye,
  FaComment,
  FaPaperPlane,
  FaClipboardList,
  FaHardHat,
  FaChartLine,
  FaMicrochip,
  FaImages,
  FaTrash,
  FaPlus,
  FaBuilding,
  FaPhone,
  FaEnvelope,
  FaHome,
  FaArrowLeft,
  FaSave,
  FaFilePdf,
  FaSpinner,
  FaExclamationTriangle,
  FaCheck,
  FaTimes,
  FaSearch,
  FaFilter,
  FaQuoteRight,
  FaClipboardCheck,
  FaDollarSign,
  FaBoxes,
  FaTools,
  FaWifi,
  FaServer,
  FaRulerCombined,
  FaArrowsAltH,
  FaArrowsAltV,
  FaSolarPanel,
  FaChartArea,
  FaSun,
  FaThermometerHalf,
  FaTint,
  FaChartBar,
  FaBolt,
  FaBatteryFull,
  FaPercent,
  FaMapMarkerAlt as FaLocation,
  FaMoneyBillWave,
  FaLeaf
} from 'react-icons/fa';
import '../../styles/Engineer/siteassessment.css';
import { useToast, ToastNotification } from '../../assets/toastnotification';

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
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deployNotes, setDeployNotes] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [includeIoTData, setIncludeIoTData] = useState(true);
  const [analyzingData, setAnalyzingData] = useState(false);
  const [iotAnalysis, setIotAnalysis] = useState(null);
  const [config, setConfig] = useState(null);
  const [assessmentResults, setAssessmentResults] = useState(null);
  const [systemMetrics, setSystemMetrics] = useState(null);

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

  // Free Quote Cost calculations
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
    totalSystemCost: 0
  });

  // Cost calculations
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

  // Free Quote cost calculation (NO IoT data)
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

    let installationLaborCost = 0;
    if (config?.laborRates) {
      const systemSize = freeQuoteForm.systemSize || 5;
      installationLaborCost = (systemSize * config.laborRates.perKw) + (freeQuotePanelQuantity * config.laborRates.perPanel);
      installationLaborCost = Math.max(installationLaborCost, config.laborRates.minimumFee || 10000);
    } else {
      installationLaborCost = (freeQuoteForm.systemSize || 5) * 5000;
    }

    const totalSystemCost = totalEquipmentCost + installationLaborCost;

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

  // Calculate total costs based on selections
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

    let installationLaborCost = 0;
    if (config?.laborRates) {
      const systemSize = quotationForm.systemSize || 5;
      installationLaborCost = (systemSize * config.laborRates.perKw) + (panelQuantity * config.laborRates.perPanel);
      installationLaborCost = Math.max(installationLaborCost, config.laborRates.minimumFee || 10000);
    } else {
      installationLaborCost = (quotationForm.systemSize || 5) * 5000;
    }

    const totalSystemCost = totalEquipmentCost + installationLaborCost;

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

  // Function to calculate system metrics from IoT data
  const calculateSystemMetrics = (iotData) => {
    if (!iotData) return null;

    const peakSunHours = iotData.peakSunHours || 4.5;
    const shadingPercentage = iotData.shadingPercentage || 0;
    const avgTemp = iotData.averageTemperature || 25;
    const tempDerating = Math.max(0, (avgTemp - 25) * -0.004) * 100;

    const dailyEnergyNeed = 20;
    const systemEfficiency = 0.8;
    const recommendedSystemSize = dailyEnergyNeed / (peakSunHours * systemEfficiency);
    const panelWattage = 0.55;
    const panelsNeeded = Math.ceil(recommendedSystemSize / panelWattage);
    const inverterSize = Math.ceil(recommendedSystemSize * 1.2);
    const performanceRatio = 0.85 - (shadingPercentage / 100) - (tempDerating / 100);

    let optimalOrientation = 'South';
    if (peakSunHours > 5.5) optimalOrientation = 'South';
    else if (peakSunHours > 4.5) optimalOrientation = 'South-East';
    else if (peakSunHours > 3.5) optimalOrientation = 'East-West';
    else optimalOrientation = 'East';

    const optimalTilt = Math.min(30, Math.max(10, Math.floor(peakSunHours * 2.5)));
    const roofArea = (assessmentForm.roofLength || 10) * (assessmentForm.roofWidth || 8);
    const estimatedInstallationTime = Math.ceil(panelsNeeded / 4) + 1;
    const equipmentCost = panelsNeeded * 15000 + inverterSize * 8000;
    const installationCost = panelsNeeded * 2000;
    const totalCost = equipmentCost + installationCost;
    const electricityRate = 12;
    const annualProduction = recommendedSystemSize * peakSunHours * 365 * systemEfficiency;
    const monthlySavings = (annualProduction * electricityRate) / 12;
    const paybackPeriod = totalCost / (monthlySavings * 12);
    const co2Offset = annualProduction * 0.5;

    return {
      peakSunHours,
      shadingPercentage,
      averageIrradiance: iotData.averageIrradiance || 0,
      averageTemperature: iotData.averageTemperature || 0,
      averageHumidity: iotData.averageHumidity || 0,
      temperatureRange: `${iotData.minTemperature?.toFixed(1) || 0}°C - ${iotData.maxTemperature?.toFixed(1) || 0}°C`,
      temperatureDerating: tempDerating.toFixed(1),
      gpsLocation: iotData.gpsCoordinates,
      recommendedSystemSize: recommendedSystemSize.toFixed(1),
      panelsNeeded,
      inverterSize,
      performanceRatio: (performanceRatio * 100).toFixed(1),
      optimalOrientation,
      optimalTilt,
      availableRoofArea: roofArea.toFixed(1),
      estimatedInstallationTime,
      estimatedTotalCost: totalCost,
      estimatedMonthlySavings: monthlySavings,
      paybackPeriod: paybackPeriod.toFixed(1),
      co2Offset: co2Offset.toFixed(0),
      annualProduction: annualProduction.toFixed(0)
    };
  };

  const calculateSuitabilityScore = (peakSunHours, shadingPercentage, tempDerating) => {
    let score = 100;
    if (peakSunHours >= 5.5) score += 0;
    else if (peakSunHours >= 5) score -= 5;
    else if (peakSunHours >= 4.5) score -= 10;
    else if (peakSunHours >= 4) score -= 20;
    else score -= 35;

    if (shadingPercentage <= 5) score += 0;
    else if (shadingPercentage <= 10) score -= 10;
    else if (shadingPercentage <= 15) score -= 20;
    else score -= 30;

    if (tempDerating >= -3) score += 0;
    else if (tempDerating >= -5) score -= 10;
    else if (tempDerating >= -8) score -= 20;
    else score -= 30;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const ASSESSMENT_TYPES = {
    free_quote: {
      label: 'Free Quote',
      color: 'free-quote-enad',
      icon: FaQuoteRight,
      statusKey: 'status'
    },
    pre_assessment: {
      label: 'Pre-Assessment',
      color: 'pre-assessment-enad',
      icon: FaClipboardCheck,
      statusKey: 'assessmentStatus'
    }
  };

  const FREE_QUOTE_STATUS = {
    pending: { label: 'Pending', color: 'pending-enad', icon: FaClock },
    assigned: { label: 'Assigned', color: 'processing-enad', icon: FaUser },
    processing: { label: 'Processing', color: 'processing-enad', icon: FaTools },
    completed: { label: 'Completed', color: 'completed-enad', icon: FaCheckCircle },
    cancelled: { label: 'Cancelled', color: 'cancelled-enad', icon: FaTimes }
  };

  const PRE_ASSESSMENT_STATUS = {
    pending_payment: { label: 'Pending Payment', color: 'pending-enad', icon: FaDollarSign },
    scheduled: { label: 'Scheduled', color: 'scheduled-enad', icon: FaClock },
    site_visit_ongoing: { label: 'Site Visit Ongoing', color: 'site-visit-enad', icon: FaHardHat },
    device_deployed: { label: 'Device Deployed', color: 'device-deployed-enad', icon: FaMicrochip },
    data_collecting: { label: 'Collecting Data', color: 'data-collecting-enad', icon: FaChartLine },
    data_analyzing: { label: 'Analyzing Data', color: 'data-analyzing-enad', icon: FaChartLine },
    report_draft: { label: 'Report Draft', color: 'report-draft-enad', icon: FaFileAlt },
    completed: { label: 'Completed', color: 'completed-enad', icon: FaCheckCircle },
    cancelled: { label: 'Cancelled', color: 'cancelled-enad', icon: FaTimes }
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

      setFreeQuoteForm({
        quotationNumber: formattedQuote.quotationReference || '',
        quotationExpiryDate: '',
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
        totalReadings: assessment.totalReadings
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
        const metrics = calculateSystemMetrics(assessment.assessmentResults);
        setSystemMetrics(metrics);
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
      fetchPreAssessmentDetails(selectedItem._id);
    } catch (err) {
      console.error('Error analyzing IoT data:', err);
      showToast(err.response?.data?.message || 'Failed to analyze IoT data', 'error');
    } finally {
      setAnalyzingData(false);
    }
  };

  // Main PDF Generation Function - Handles BOTH Free Quote AND Pre-Assessment
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

      const metrics = !isFreeQuote && (systemMetrics || (assessmentResults ? calculateSystemMetrics(assessmentResults) : null));

      const iotDataForPDF = !isFreeQuote ? {
        peakSunHours: assessmentResults?.peakSunHours || iotAnalysis?.peakSunHours || metrics?.peakSunHours || 0,
        shadingPercentage: assessmentResults?.shadingPercentage || iotAnalysis?.shadingPercentage || metrics?.shadingPercentage || 0,
        averageIrradiance: assessmentResults?.averageIrradiance || iotAnalysis?.averageIrradiance || 0,
        averageTemperature: assessmentResults?.averageTemperature || iotAnalysis?.averageTemperature || 0,
        averageHumidity: assessmentResults?.averageHumidity || iotAnalysis?.averageHumidity || 0,
        temperatureDerating: assessmentResults?.temperatureDerating || iotAnalysis?.efficiencyLoss || metrics?.temperatureDerating || 0,
        totalReadings: assessmentResults?.totalReadings || iotAnalysis?.totalReadings || 0,
        dataCollectionStart: selectedItem?.dataCollectionStart,
        dataCollectionEnd: selectedItem?.dataCollectionEnd,
        gpsCoordinates: assessmentResults?.gpsCoordinates || iotAnalysis?.gpsLocation,
        optimalOrientation: metrics?.optimalOrientation || iotAnalysis?.recommendedOrientation || 'South-facing',
        optimalTiltAngle: metrics?.optimalTilt || iotAnalysis?.recommendedTiltAngle || 15,
        recommendedSystemSize: metrics?.recommendedSystemSize || iotAnalysis?.recommendedSystemSize || systemSize,
        panelsNeeded: metrics?.panelsNeeded || panelQuantity,
        inverterSize: metrics?.inverterSize || Math.ceil(parseFloat(systemSize) * 1.2),
        performanceRatio: metrics?.performanceRatio || 85,
        estimatedMonthlySavings: metrics?.estimatedMonthlySavings || 0,
        estimatedAnnualSavings: (metrics?.estimatedMonthlySavings || 0) * 12,
        paybackPeriod: metrics?.paybackPeriod || 0,
        estimatedAnnualProduction: metrics?.annualProduction || (parseFloat(systemSize) * 1200),
        co2Offset: metrics?.co2Offset || (parseFloat(systemSize) * 800),
        roofArea: metrics?.availableRoofArea || (assessmentForm.roofLength * assessmentForm.roofWidth),
        estimatedInstallationTime: metrics?.estimatedInstallationTime || assessmentForm.estimatedInstallationTime || 3,
        roofCondition: assessmentForm.roofCondition,
        structuralIntegrity: assessmentForm.structuralIntegrity,
        temperatureRange: metrics?.temperatureRange || `${assessmentResults?.minTemperature?.toFixed(1) || 0}°C - ${assessmentResults?.maxTemperature?.toFixed(1) || 0}°C`,
        irradianceLevel: assessmentResults?.averageIrradiance || 0,
        siteSuitabilityScore: calculateSuitabilityScore(
          assessmentResults?.peakSunHours || 4.5,
          assessmentResults?.shadingPercentage || 0,
          assessmentResults?.temperatureDerating || 0
        )
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

      await axios.post(endpoint, payload, { headers: { Authorization: `Bearer ${token}` } });
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
        { headers: { 'Content-Type': 'multipart/form-data', Authorization: `Bearer ${token}` } }
      );
      setSiteImages([...siteImages, ...response.data.images]);
      showToast('Images uploaded successfully', 'success');
    } catch (err) {
      console.error('Error uploading images:', err);
      showToast('Failed to upload images', 'error');
    } finally {
      setUploading(false);
      setShowImageUploader(false);
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
    if (!deployNotes || deployNotes.trim() === '') {
      showToast('Please enter deployment notes before deploying the device', 'warning');
      return;
    }

    const confirmed = window.confirm(
      `⚠️ DEPLOY DEVICE CONFIRMATION ⚠️\n\n` +
      `Are you sure you want to deploy the device on site?\n\n` +
      `📋 Device Details:\n` +
      `• Device ID: ${selectedItem.iotDeviceId?.deviceId || selectedItem.assignedDeviceId || 'N/A'}\n` +
      `• Device Name: ${selectedItem.iotDeviceId?.deviceName || selectedItem.assignedDevice?.deviceName || 'IoT Device'}\n\n` +
      `📍 Location: ${getFullAddress(selectedItem.address)}\n\n` +
      `📝 Deployment Notes:\n${deployNotes}\n\n` +
      `⚠️ This will start 7-day data collection period.\n` +
      `The device cannot be reassigned during this period.\n\n` +
      `Click OK to confirm deployment.`
    );

    if (!confirmed) return;

    setSubmitting(true);
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
    if (!window.confirm('Are you sure you want to submit the final report? This action cannot be undone.')) return;
    setSubmitting(true);
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
    if (typeFilter !== 'all') filtered = filtered.filter(item => item.type === typeFilter);
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => {
        const status = item.type === 'free_quote' ? item.status : item.assessmentStatus;
        return status === statusFilter;
      });
    }
    setFilteredAssessments(filtered);
  }, [allAssessments, searchTerm, typeFilter, statusFilter]);

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

  useEffect(() => {
    if (assessmentResults) {
      const metrics = calculateSystemMetrics(assessmentResults);
      setSystemMetrics(metrics);
    } else {
      setSystemMetrics(null);
    }
  }, [assessmentResults]);

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
      <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} position="bottom-left" />
      <div className="assessments-header-enad">
        <div className="skeleton-line-enad large-enad"></div>
        <div className="skeleton-line-enad medium-enad"></div>
      </div>
      <div className="search-filters-enad">
        <div className="skeleton-search-enad"></div>
        <div className="skeleton-select-enad"></div>
        <div className="skeleton-select-enad"></div>
      </div>
      <div className="assessments-grid-enad">
        {[1, 2, 3, 4, 5, 6].map(i => <SkeletonCard key={i} />)}
      </div>
    </div>
  );

  if (loading && allAssessments.length === 0) {
    return <SkeletonList />;
  }

  // Assessment List View
  if (!selectedItem) {
    const availableStatuses = [...new Set(allAssessments.map(item => {
      return item.type === 'free_quote' ? item.status : item.assessmentStatus;
    }))];

    return (
      <>
        <Helmet><title>My Assessments | Engineer | SOLARIS</title></Helmet>
        <div className="my-assessments-enad">
          <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} position="bottom-left" />
          <div className="assessments-header-enad">
            <h1>My Assessments</h1>
            <p>Manage free quotes and site assessments assigned to you</p>
          </div>
          <div className="search-filters-enad">
            <div className="search-wrapper-enad">
              <FaSearch className="search-icon-enad" />
              <input type="text" placeholder="Search by reference or client name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="search-input-enad" />
            </div>
            <div className="filter-wrapper-enad">
              <FaFilter className="filter-icon-enad" />
              <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="filter-select-enad">
                <option value="all">All Types</option>
                <option value="free_quote">Free Quotes</option>
                <option value="pre_assessment">Pre-Assessments</option>
              </select>
            </div>
            <div className="filter-wrapper-enad">
              <FaFilter className="filter-icon-enad" />
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="filter-select-enad">
                <option value="all">All Status</option>
                {availableStatuses.map(status => (
                  <option key={status} value={status}>{status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>
                ))}
              </select>
            </div>
          </div>
          {error && <div className="error-container-enad"><FaExclamationTriangle /><span>{error}</span></div>}
          {filteredAssessments.length === 0 ? (
            <div className="empty-state-enad">
              <FaClipboardList className="empty-icon-enad" />
              <h3>No assessments found</h3>
              <p>{allAssessments.length === 0 ? "You don't have any assessments assigned yet." : "No assessments match your search criteria."}</p>
            </div>
          ) : (
            <div className="assessments-grid-enad">
              {filteredAssessments.map((item) => {
                const StatusConfig = getStatusConfig(item);
                const TypeConfig = getTypeConfig(item.type);
                const StatusIcon = StatusConfig.icon;
                const TypeIcon = TypeConfig.icon;
                return (
                  <div key={`${item.type}-${item.id}`} className="assessment-card-enad" onClick={() => handleSelectItem(item)}>
                    <div className="card-content-enad">
                      <div className="card-header-enad">
                        <div className={`type-badge-enad ${TypeConfig.color}`}><TypeIcon />{TypeConfig.label}</div>
                        <div className={`status-badge-enad ${StatusConfig.color}`}><StatusIcon />{StatusConfig.label}</div>
                      </div>
                      <h3 className="client-name-enad">{item.clientName} {item.clientLastName}</h3>
                      <p className="reference-enad">Ref: {item.bookingReference || item.quotationReference}</p>
                      <div className="card-details-enad">
                        <div className="detail-item-enad"><FaMapMarkerAlt className="detail-icon-enad" /><span className="truncate">{getFullAddress(item.address)}</span></div>
                        <div className="detail-item-enad"><FaCalendarAlt className="detail-icon-enad" /><span>Requested: {formatDate(item.preferredDate || item.requestedAt)}</span></div>
                        <div className="detail-item-enad"><FaHome className="detail-icon-enad" /><span className="capitalize">{item.propertyType || 'N/A'}</span></div>
                        {item.systemType && <div className="detail-item-enad"><FaSolarPanel className="detail-icon-enad" /><span>System: {getSystemTypeLabel(item.systemType)}</span></div>}
                        {(item.roofLength || item.roofWidth) && <div className="detail-item-enad"><FaRulerCombined className="detail-icon-enad" /><span>Roof: {item.roofLength || '?'}m x {item.roofWidth || '?'}m</span></div>}
                        {item.type === 'free_quote' && item.monthlyBill && <div className="detail-item-enad"><FaDollarSign className="detail-icon-enad" /><span>Monthly Bill: {formatCurrency(item.monthlyBill)}</span></div>}
                        {item.type === 'pre_assessment' && hasDeviceAssigned(item) && <div className="detail-item-enad"><FaMicrochip className="detail-icon-enad" /><span className="badge-small-enad">Device Assigned</span></div>}
                        {item.type === 'pre_assessment' && item.dataCollectionStart && <div className="detail-item-enad"><FaChartLine className="detail-icon-enad" /><span>Data Collection: {formatDate(item.dataCollectionStart)} - {formatDate(item.dataCollectionEnd) || 'Ongoing'}</span></div>}
                      </div>
                      <div className="card-footer-enad">
                        <div className="card-badges-enad">
                          {item.type === 'pre_assessment' && item.sitePhotos?.length > 0 && <span className="badge-small-enad photos-enad"><FaCamera /> {item.sitePhotos.length} Photos</span>}
                          {item.type === 'pre_assessment' && item.totalReadings > 0 && <span className="badge-small-enad data-enad"><FaChartLine /> {item.totalReadings} Readings</span>}
                          {item.type === 'free_quote' && item.quotationFile && <span className="badge-small-enad quotation-enad"><FaFilePdf /> Quotation Ready</span>}
                        </div>
                        <button className="view-link-enad">View Details <FaArrowLeft className="rotate-180" /></button>
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
    const StatusIcon = StatusConfig.icon;
    const TypeIcon = TypeConfig.icon;

    return (
      <>
        <Helmet><title>Free Quote Details | Engineer | SOLARIS</title></Helmet>
        <div className="my-assessments-enad">
          <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} position="bottom-left" />
          <div className="detail-view-enad">
            <div className="detail-content-enad">
              <button onClick={handleBackToList} className="back-button-enad"><FaArrowLeft /> Back to Assessments</button>
              <div className="detail-header-enad">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`type-badge-enad ${TypeConfig.color}`}><TypeIcon /> {TypeConfig.label}</span>
                    <h1 className="detail-title-enad">{selectedItem.quotationReference}</h1>
                  </div>
                  <div className="client-meta-enad">
                    <div className="client-meta-item-enad"><FaUser /> {selectedItem.clientName} {selectedItem.clientLastName}</div>
                    <div className="client-meta-item-enad"><FaEnvelope /> {selectedItem.clientEmail || 'No email'}</div>
                    <div className="client-meta-item-enad"><FaPhone /> {selectedItem.clientPhone || 'No contact'}</div>
                    <div className="client-meta-item-enad"><FaBuilding /> <span className="capitalize">{selectedItem.clientType || 'Residential'}</span></div>
                  </div>
                </div>
                <div className={`status-badge-enad ${StatusConfig.color}`}><StatusIcon /> {StatusConfig.label}</div>
              </div>
              <div className="info-grid-enad">
                <div className="info-item-enad"><span className="info-label-enad">Monthly Bill</span><span className="info-value-enad">{formatCurrency(selectedItem.monthlyBill)}</span></div>
                <div className="info-item-enad"><span className="info-label-enad">Property Type</span><span className="info-value-enad capitalize">{selectedItem.propertyType}</span></div>
                <div className="info-item-enad"><span className="info-label-enad">Desired Capacity</span><span className="info-value-enad">{selectedItem.desiredCapacity || 'Not specified'}</span></div>
                {selectedItem.systemType && <div className="info-item-enad"><span className="info-label-enad">Preferred System Type</span><span className="info-value-enad"><FaSolarPanel className="inline-icon" />{getSystemTypeLabel(selectedItem.systemType)}</span></div>}
                <div className="info-item-enad"><span className="info-label-enad">Requested Date</span><span className="info-value-enad">{formatDate(selectedItem.requestedAt)}</span></div>
                <div className="info-item-enad info-full-width-enad"><span className="info-label-enad">Address</span><span className="info-value-enad">{getFullAddress(selectedItem.address)}</span></div>
              </div>
              <div className="detail-section-enad">
                <h3 className="detail-section-title-enad">Equipment Selection & Quotation</h3>

                {/* Basic Information */}
                <div className="quotation-section">
                  <h4>Basic Information</h4>
                  <div className="form-grid-enad">
                    <div className="form-group-enad"><label>Quotation Number</label><input type="text" value={freeQuoteForm.quotationNumber} onChange={(e) => handleFreeQuoteFormChange('quotationNumber', e.target.value)} /></div>
                    <div className="form-group-enad"><label>Expiry Date (30 Days)</label><input type="date" value={freeQuoteForm.quotationExpiryDate} onChange={(e) => handleFreeQuoteFormChange('quotationExpiryDate', e.target.value)} /></div>
                    <div className="form-group-enad"><label>System Type</label><select value={freeQuoteForm.systemType} onChange={(e) => handleFreeQuoteFormChange('systemType', e.target.value)}>{SYSTEM_TYPES.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}</select></div>
                    <div className="form-group-enad"><label>System Size (kWp) *</label><input type="number" step="0.5" value={freeQuoteForm.systemSize} onChange={(e) => handleFreeQuoteFormChange('systemSize', parseFloat(e.target.value))} placeholder="e.g., 5.0" /></div>
                  </div>
                </div>

                {/* Solar Panels */}
                <div className="quotation-section">
                  <h4><FaSolarPanel /> Solar Panels</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select value={freeQuoteSelectedPanel?._id || ''} onChange={(e) => { const panel = availablePanels.find(p => p._id === e.target.value); setFreeQuoteSelectedPanel(panel); if (panel && panel.unit === 'watt') setFreeQuotePanelQuantity(1); }}>
                        <option value="">-- Select Panel --</option>
                        {availablePanels.filter(p => p.isActive).map(panel => (<option key={panel._id} value={panel._id}>{panel.name} - {panel.brand} - ₱{panel.price.toLocaleString()}/{panel.unit}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}><input type="number" min="1" value={freeQuotePanelQuantity} onChange={(e) => setFreeQuotePanelQuantity(parseInt(e.target.value) || 0)} disabled={freeQuoteSelectedPanel?.unit === 'watt'} /></div>
                    <div className="cost-display"><span>{formatCurrency(freeQuoteCalculatedCosts.panelCost)}</span></div>
                  </div>
                  {freeQuoteSelectedPanel?.unit === 'watt' && <small className="form-hint">Price is per watt. Total calculated based on system size: {freeQuoteForm.systemSize} kWp</small>}
                </div>

                {/* Inverters */}
                <div className="quotation-section">
                  <h4><FaBolt /> Inverters</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select value={freeQuoteSelectedInverter?._id || ''} onChange={(e) => { const inverter = availableInverters.find(i => i._id === e.target.value); setFreeQuoteSelectedInverter(inverter); }}>
                        <option value="">-- Select Inverter --</option>
                        {availableInverters.filter(i => i.isActive).map(inverter => (<option key={inverter._id} value={inverter._id}>{inverter.name} - {inverter.brand} - ₱{inverter.price.toLocaleString()}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}><input type="number" min="1" value={freeQuoteInverterQuantity} onChange={(e) => setFreeQuoteInverterQuantity(parseInt(e.target.value) || 0)} /></div>
                    <div className="cost-display"><span>{formatCurrency(freeQuoteCalculatedCosts.inverterCost)}</span></div>
                  </div>
                </div>

                {/* Batteries */}
                <div className="quotation-section">
                  <h4><FaBatteryFull /> Batteries (Optional)</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select value={freeQuoteSelectedBattery?._id || ''} onChange={(e) => { const battery = availableBatteries.find(b => b._id === e.target.value); setFreeQuoteSelectedBattery(battery); }}>
                        <option value="">-- No Battery --</option>
                        {availableBatteries.filter(b => b.isActive).map(battery => (<option key={battery._id} value={battery._id}>{battery.name} - {battery.brand} - ₱{battery.price.toLocaleString()}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}><input type="number" min="0" value={freeQuoteBatteryQuantity} onChange={(e) => setFreeQuoteBatteryQuantity(parseInt(e.target.value) || 0)} /></div>
                    <div className="cost-display"><span>{formatCurrency(freeQuoteCalculatedCosts.batteryCost)}</span></div>
                  </div>
                </div>

                {/* Mounting Structure */}
                <div className="quotation-section">
                  <h4><FaTools /> Mounting Structure</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select value={freeQuoteSelectedMountingStructure?._id || ''} onChange={(e) => { const structure = availableMountingStructures.find(m => m._id === e.target.value); setFreeQuoteSelectedMountingStructure(structure); }}>
                        <option value="">-- Select Mounting Structure --</option>
                        {availableMountingStructures.filter(m => m.isActive).map(structure => (<option key={structure._id} value={structure._id}>{structure.name} - {structure.brand} - ₱{structure.price.toLocaleString()}/{structure.unit}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}><input type="number" min="1" value={freeQuoteMountingStructureQuantity} onChange={(e) => setFreeQuoteMountingStructureQuantity(parseInt(e.target.value) || 0)} /></div>
                    <div className="cost-display"><span>{formatCurrency(freeQuoteCalculatedCosts.mountingCost)}</span></div>
                  </div>
                </div>

                {/* Electrical Components */}
                <div className="quotation-section">
                  <h4><FaBolt /> Electrical Components</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddElectricalComponent}><FaPlus /> Add Component</button>
                  {freeQuoteSelectedElectricalComponents.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select value={item.id || ''} onChange={(e) => freeQuoteUpdateElectricalComponent(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Component --</option>
                        {availableElectricalComponents.filter(c => c.isActive).map(comp => (<option key={comp._id} value={comp._id}>{comp.name} - ₱{comp.price.toLocaleString()}</option>))}
                      </select>
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => freeQuoteUpdateElectricalComponent(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveElectricalComponent(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Cables */}
                <div className="quotation-section">
                  <h4><FaWifi /> Cables and Wiring</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddCable}><FaPlus /> Add Cable</button>
                  {freeQuoteSelectedCables.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select value={item.id || ''} onChange={(e) => freeQuoteUpdateCable(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Cable Type --</option>
                        {availableCables.filter(c => c.isActive).map(cable => (<option key={cable._id} value={cable._id}>{cable.name} - ₱{cable.price.toLocaleString()}/{cable.unit}</option>))}
                      </select>
                      <input type="number" placeholder="Length (m)" value={item.length} onChange={(e) => freeQuoteUpdateCable(index, 'length', parseFloat(e.target.value) || 0)} style={{ width: '100px' }} />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => freeQuoteUpdateCable(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveCable(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Junction Boxes */}
                <div className="quotation-section">
                  <h4><FaBoxes /> Junction Boxes</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddJunctionBox}><FaPlus /> Add Junction Box</button>
                  {freeQuoteSelectedJunctionBoxes.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select value={item.id || ''} onChange={(e) => freeQuoteUpdateJunctionBox(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Junction Box --</option>
                        {availableJunctionBoxes.filter(j => j.isActive).map(box => (<option key={box._id} value={box._id}>{box.name} - ₱{box.price.toLocaleString()}</option>))}
                      </select>
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => freeQuoteUpdateJunctionBox(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveJunctionBox(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Disconnect Switches */}
                <div className="quotation-section">
                  <h4><FaServer /> Disconnect Switches</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddDisconnectSwitch}><FaPlus /> Add Switch</button>
                  {freeQuoteSelectedDisconnectSwitches.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select value={item.id || ''} onChange={(e) => freeQuoteUpdateDisconnectSwitch(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Switch --</option>
                        {availableDisconnectSwitches.filter(s => s.isActive).map(sw => (<option key={sw._id} value={sw._id}>{sw.name} - ₱{sw.price.toLocaleString()}</option>))}
                      </select>
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => freeQuoteUpdateDisconnectSwitch(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveDisconnectSwitch(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Meters */}
                <div className="quotation-section">
                  <h4><FaChartBar /> Meters</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddMeter}><FaPlus /> Add Meter</button>
                  {freeQuoteSelectedMeters.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select value={item.id || ''} onChange={(e) => freeQuoteUpdateMeter(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Meter --</option>
                        {availableMeters.filter(m => m.isActive).map(meter => (<option key={meter._id} value={meter._id}>{meter.name} - ₱{meter.price.toLocaleString()}</option>))}
                      </select>
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => freeQuoteUpdateMeter(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveMeter(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Additional Equipment */}
                <div className="quotation-section">
                  <h4>Additional Equipment</h4>
                  <button type="button" className="btn-add-item" onClick={freeQuoteAddAdditionalEquipment}><FaPlus /> Add Custom Item</button>
                  {freeQuoteAdditionalEquipment.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <input type="text" placeholder="Item name" value={item.name} onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'name', e.target.value)} style={{ flex: 2 }} />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <input type="number" placeholder="Price" value={item.price} onChange={(e) => freeQuoteUpdateAdditionalEquipment(index, 'price', parseFloat(e.target.value) || 0)} style={{ width: '120px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => freeQuoteRemoveAdditionalEquipment(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>
                {/* Installation Labor - Add this before the Complete Cost Summary */}
                <div className="quotation-section">
                  <h4><FaHardHat /> Installation Labor</h4>
                  <div className="labor-calculation">
                    <div className="labor-detail">
                      <span>Per kW installation ({freeQuoteForm.systemSize || 0} kW x ₱{config?.laborRates?.perKw || 5000})</span>
                      <span>{formatCurrency((freeQuoteForm.systemSize || 0) * (config?.laborRates?.perKw || 5000))}</span>
                    </div>
                    <div className="labor-detail">
                      <span>Per panel installation ({freeQuotePanelQuantity} panels x ₱{config?.laborRates?.perPanel || 1000})</span>
                      <span>{formatCurrency(freeQuotePanelQuantity * (config?.laborRates?.perPanel || 1000))}</span>
                    </div>
                    <div className="labor-total">
                      <strong>Total Labor Cost</strong>
                      <strong>{formatCurrency(freeQuoteCalculatedCosts.installationLaborCost)}</strong>
                    </div>
                  </div>
                </div>


                {/* Cost Summary */}
                <div className="cost-summary-large" style={{ marginTop: '20px' }}>
                  <h3>Complete Cost Summary</h3>
                  <div className="summary-row"><span>Solar Panels:</span><span>{formatCurrency(freeQuoteCalculatedCosts.panelCost)}</span></div>
                  <div className="summary-row"><span>Inverters:</span><span>{formatCurrency(freeQuoteCalculatedCosts.inverterCost)}</span></div>
                  <div className="summary-row"><span>Batteries:</span><span>{formatCurrency(freeQuoteCalculatedCosts.batteryCost)}</span></div>
                  <div className="summary-row"><span>Mounting Structure:</span><span>{formatCurrency(freeQuoteCalculatedCosts.mountingCost)}</span></div>
                  <div className="summary-row"><span>Electrical Components:</span><span>{formatCurrency(freeQuoteCalculatedCosts.electricalCost)}</span></div>
                  <div className="summary-row"><span>Cables & Wiring:</span><span>{formatCurrency(freeQuoteCalculatedCosts.cableCost)}</span></div>
                  <div className="summary-row"><span>Junction Boxes:</span><span>{formatCurrency(freeQuoteCalculatedCosts.junctionBoxCost)}</span></div>
                  <div className="summary-row"><span>Disconnect Switches:</span><span>{formatCurrency(freeQuoteCalculatedCosts.disconnectSwitchCost)}</span></div>
                  <div className="summary-row"><span>Meters:</span><span>{formatCurrency(freeQuoteCalculatedCosts.meterCost)}</span></div>
                  <div className="summary-row"><span>Additional Equipment:</span><span>{formatCurrency(freeQuoteCalculatedCosts.additionalCost)}</span></div>
                  <div className="summary-row"><span>Equipment Total:</span><span>{formatCurrency(freeQuoteCalculatedCosts.totalEquipmentCost)}</span></div>
                  <div className="summary-row"><span>Installation Labor:</span><span>{formatCurrency(freeQuoteCalculatedCosts.installationLaborCost)}</span></div>
                  <div className="summary-row total"><span>TOTAL SYSTEM COST:</span><span>{formatCurrency(freeQuoteCalculatedCosts.totalSystemCost)}</span></div>
                </div>

                {/* Payment Terms & Remarks */}
                <div className="form-group-enad"><label>Payment Terms</label><textarea value={freeQuoteForm.paymentTerms} onChange={(e) => handleFreeQuoteFormChange('paymentTerms', e.target.value)} rows={2} placeholder="e.g., 30% down payment, 70% upon completion" /></div>
                <div className="form-group-enad"><label>Remarks</label><textarea value={freeQuoteForm.remarks} onChange={(e) => handleFreeQuoteFormChange('remarks', e.target.value)} rows={2} placeholder="Additional notes or special instructions" /></div>

                <div className="action-buttons-enad" style={{ marginTop: '20px' }}>
                  <button onClick={generateQuotationPDF} disabled={generatingPDF || !freeQuoteForm.systemSize || freeQuoteCalculatedCosts.totalSystemCost === 0} className="btn-primary-enad">
                    {generatingPDF ? <FaSpinner className="spinner-enad" /> : <FaFilePdf />} Generate & Upload PDF
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
  const StatusIcon = StatusConfig.icon;
  const TypeIcon = TypeConfig.icon;
  const deviceAssigned = hasDeviceAssigned(selectedItem);
  const hasDataCollection = selectedItem.dataCollectionStart && selectedItem.dataCollectionEnd;
  const canAnalyze = selectedItem.dataCollectionEnd && !iotAnalysis;

  return (
    <>
      <Helmet><title>Pre-Assessment Details | Engineer | SOLARIS</title></Helmet>
      <div className="my-assessments-enad">
        <ToastNotification show={toast.show} message={toast.message} type={toast.type} onClose={hideToast} position="bottom-left" />
        <div className="detail-view-enad">
          <div className="detail-content-enad">
            <button onClick={handleBackToList} className="back-button-enad"><FaArrowLeft /> Back to Assessments</button>
            <div className="detail-header-enad">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`type-badge-enad ${TypeConfig.color}`}><TypeIcon /> {TypeConfig.label}</span>
                  <h1 className="detail-title-enad">{selectedItem.bookingReference}</h1>
                </div>
                <div className="client-meta-enad">
                  <div className="client-meta-item-enad"><FaUser /> {selectedItem.clientName} {selectedItem.clientLastName}</div>
                  <div className="client-meta-item-enad"><FaEnvelope /> {selectedItem.clientEmail || 'No email'}</div>
                  <div className="client-meta-item-enad"><FaPhone /> {selectedItem.clientPhone || 'No contact'}</div>
                  <div className="client-meta-item-enad"><FaBuilding /> <span className="capitalize">{selectedItem.clientType || 'Residential'}</span></div>
                </div>
              </div>
              <div className={`status-badge-enad ${StatusConfig.color}`}><StatusIcon /> {StatusConfig.label}</div>
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
                  {selectedItem.systemType && <div className="info-item-enad"><span className="info-label-enad">Preferred System Type</span><span className="info-value-enad"><FaSolarPanel className="inline-icon" />{getSystemTypeLabel(selectedItem.systemType)}</span></div>}
                  <div className="info-item-enad"><span className="info-label-enad">Roof Type</span><span className="info-value-enad capitalize">{selectedItem.roofType || 'Not specified'}</span></div>
                  {(selectedItem.roofLength || selectedItem.roofWidth) && <div className="info-item-enad"><span className="info-label-enad">Roof Dimensions (from client)</span><span className="info-value-enad"><FaRulerCombined className="inline-icon" />{selectedItem.roofLength ? `${selectedItem.roofLength}m` : '?'} x {selectedItem.roofWidth ? `${selectedItem.roofWidth}m` : '?'}</span></div>}
                  <div className="info-item-enad"><span className="info-label-enad">Desired Capacity</span><span className="info-value-enad">{selectedItem.desiredCapacity || 'Not specified'}</span></div>
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

                {hasDataCollection && (
                  <div className="detail-section-enad">
                    <div className="section-header-enad"><h3 className="detail-section-title-enad">IoT Data Analysis (7-Day Monitoring)</h3>{canAnalyze && <button onClick={analyzeIoTData} disabled={analyzingData} className="btn-secondary-enad" style={{ padding: '5px 12px', fontSize: '12px' }}>{analyzingData ? <FaSpinner className="spinner-enad" /> : <FaChartArea />} Analyze Data</button>}</div>
                    {iotAnalysis ? (
                      <div className="iot-analysis-grid-enad">
                        <div className="analysis-card-enad irradiance-enad"><FaSun className="analysis-icon-enad" /><div className="analysis-stats-enad"><div className="stat-enad"><span className="stat-label-enad">Avg Irradiance</span><span className="stat-value-enad">{iotAnalysis.averageIrradiance?.toFixed(0) || 0} W/m²</span></div><div className="stat-enad"><span className="stat-label-enad">Peak Irradiance</span><span className="stat-value-enad">{iotAnalysis.maxIrradiance?.toFixed(0) || 0} W/m²</span></div><div className="stat-enad"><span className="stat-label-enad">Peak Sun Hours</span><span className="stat-value-enad">{iotAnalysis.peakSunHours?.toFixed(1) || 0} hrs/day</span></div></div></div>
                        <div className="analysis-card-enad temperature-enad"><FaThermometerHalf className="analysis-icon-enad" /><div className="analysis-stats-enad"><div className="stat-enad"><span className="stat-label-enad">Avg Temperature</span><span className="stat-value-enad">{iotAnalysis.averageTemperature?.toFixed(1) || 0}°C</span></div><div className="stat-enad"><span className="stat-label-enad">Temperature Range</span><span className="stat-value-enad">{iotAnalysis.minTemperature?.toFixed(1) || 0}°C - {iotAnalysis.maxTemperature?.toFixed(1) || 0}°C</span></div><div className="stat-enad"><span className="stat-label-enad">Efficiency Loss</span><span className="stat-value-enad">{iotAnalysis.efficiencyLoss || 0}%</span></div></div></div>
                        <div className="analysis-card-enad humidity-enad"><FaTint className="analysis-icon-enad" /><div className="analysis-stats-enad"><div className="stat-enad"><span className="stat-label-enad">Avg Humidity</span><span className="stat-value-enad">{iotAnalysis.averageHumidity?.toFixed(0) || 0}%</span></div><div className="stat-enad"><span className="stat-label-enad">Humidity Range</span><span className="stat-value-enad">{iotAnalysis.minHumidity?.toFixed(0) || 0}% - {iotAnalysis.maxHumidity?.toFixed(0) || 0}%</span></div></div></div>
                        <div className="analysis-card-enad recommendations-enad"><FaChartBar className="analysis-icon-enad" /><div className="analysis-stats-enad"><div className="stat-enad"><span className="stat-label-enad">Recommended System Size</span><span className="stat-value-enad">{iotAnalysis.recommendedSystemSize || 0} kWp</span></div><div className="stat-enad"><span className="stat-label-enad">Optimal Orientation</span><span className="stat-value-enad">{iotAnalysis.recommendedOrientation || 'South-facing'}</span></div><div className="stat-enad"><span className="stat-label-enad">Recommended Tilt Angle</span><span className="stat-value-enad">{iotAnalysis.recommendedTiltAngle || 15}°</span></div><div className="stat-enad"><span className="stat-label-enad">Shading Detection</span><span className="stat-value-enad">{iotAnalysis.shadingPercentage ? `${iotAnalysis.shadingPercentage}% shading` : 'Minimal'}</span></div></div></div>
                      </div>
                    ) : (<div className="no-data-enad"><p>Click "Analyze Data" to process the 7-day IoT monitoring data and get system recommendations.</p></div>)}
                  </div>
                )}

                {deviceAssigned ? (
                  <div className="device-card-enad"><div className="device-card-title-enad"><FaMicrochip /> Assigned Device</div><div className="device-info-enad"><div className="device-info-item-enad"><span className="device-info-label-enad">Device ID</span><span className="device-info-value-enad">{selectedItem.iotDeviceId?.deviceId || selectedItem.assignedDevice?.deviceId || selectedItem.assignedDeviceId || 'N/A'}</span></div><div className="device-info-item-enad"><span className="device-info-label-enad">Device Name</span><span className="device-info-value-enad">{selectedItem.iotDeviceId?.deviceName || selectedItem.assignedDevice?.deviceName || 'IoT Device'}</span></div><div className="device-info-item-enad"><span className="device-info-label-enad">Status</span><span className={`device-info-value-enad ${selectedItem.deviceDeployedAt ? 'text-green-600' : 'text-yellow-600'}`}>{selectedItem.deviceDeployedAt ? 'Deployed' : 'Ready for Deployment'}</span></div>{selectedItem.deviceDeployedAt && (<div className="device-info-item-enad"><span className="device-info-label-enad">Deployed At</span><span className="device-info-value-enad">{formatDateTime(selectedItem.deviceDeployedAt)}</span></div>)}</div></div>
                ) : (<div className="no-device-card-enad"><FaExclamationTriangle /> No device assigned yet. Please contact admin.</div>)}
              </div>
            )}

            {/* Site Inspection Tab */}
            {activeTab === 'site-inspection' && (
              <div>
                <div className="action-buttons-enad">
                  <button onClick={saveSiteAssessment} disabled={submitting} className="btn-secondary-enad">{submitting ? <FaSpinner className="spinner-enad" /> : <FaSave />} Save Draft</button>
                  {selectedItem.assessmentStatus !== 'device_deployed' && selectedItem.assessmentStatus !== 'data_collecting' && deviceAssigned && (<button onClick={deployDevice} disabled={submitting || !deployNotes || deployNotes.trim() === ''} className="btn-success-enad" style={{ opacity: (!deployNotes || deployNotes.trim() === '') ? 0.5 : 1 }}>{submitting ? <FaSpinner className="spinner-enad" /> : <FaMicrochip />} Deploy Device (Start 7-day Monitoring)</button>)}
                </div>
                <div className="form-group-enad"><label className="form-label-enad">Roof Condition</label><div className="options-group-enad">{ROOF_CONDITIONS.map(condition => (<button key={condition.value} type="button" onClick={() => handleAssessmentFormChange('roofCondition', condition.value)} className={`option-btn-enad ${assessmentForm.roofCondition === condition.value ? 'active-enad' : ''}`}>{condition.label}</button>))}</div></div>
                <div className="form-group-enad"><label className="form-label-enad"><FaRulerCombined className="inline-icon" /> Roof Dimensions (meters) <span style={{ color: '#C62828' }}>*</span></label><div className="form-row-enad"><div className="dimension-input-enad"><FaArrowsAltH className="dimension-icon-small-enad" /><input type="number" step="0.1" value={assessmentForm.roofLength || ''} onChange={(e) => handleAssessmentFormChange('roofLength', parseFloat(e.target.value))} className="form-input-enad" placeholder="Length (m)" required /></div><div className="dimension-input-enad"><FaArrowsAltV className="dimension-icon-small-enad" /><input type="number" step="0.1" value={assessmentForm.roofWidth || ''} onChange={(e) => handleAssessmentFormChange('roofWidth', parseFloat(e.target.value))} className="form-input-enad" placeholder="Width (m)" required /></div></div><small className="form-hint-enad">Measured during site inspection (Required)</small></div>
                <div className="form-group-enad"><label className="form-label-enad">Structural Integrity</label><div className="options-group-enad">{STRUCTURAL_INTEGRITY.map(integrity => (<button key={integrity.value} type="button" onClick={() => handleAssessmentFormChange('structuralIntegrity', integrity.value)} className={`option-btn-enad ${assessmentForm.structuralIntegrity === integrity.value ? 'active-enad' : ''}`}>{integrity.label}</button>))}</div></div>
                <div className="form-group-enad"><label className="form-label-enad">Estimated Installation Time (days)</label><input type="number" value={assessmentForm.estimatedInstallationTime} onChange={(e) => handleAssessmentFormChange('estimatedInstallationTime', e.target.value)} className="form-input-enad" style={{ width: '150px' }} required /></div>
                {deviceAssigned && (<div className="form-group-enad"><label className="form-label-enad">Deployment Notes <span style={{ color: '#C62828' }}>*</span></label><textarea value={deployNotes} onChange={(e) => setDeployNotes(e.target.value)} rows={3} className="form-textarea-enad" placeholder="Enter deployment notes, device placement location, etc... (Required)" required />{!deployNotes && (<small className="form-hint-enad" style={{ color: '#C62828' }}>Deployment notes are required before deploying the device</small>)}</div>)}
                <div className="form-group-enad"><label className="form-label-enad">Site Visit Notes</label><textarea value={assessmentForm.siteVisitNotes} onChange={(e) => handleAssessmentFormChange('siteVisitNotes', e.target.value)} rows={4} className="form-textarea-enad" placeholder="Additional notes, observations, recommendations..." required /></div>
                <div className="form-group-enad"><label className="form-label-enad">Engineer Recommendations</label><textarea value={assessmentForm.recommendations} onChange={(e) => handleAssessmentFormChange('recommendations', e.target.value)} rows={3} className="form-textarea-enad" placeholder="Summary of recommendations for the client..." required /></div>
                <div className="form-group-enad"><label className="form-label-enad">Technical Findings</label><textarea value={assessmentForm.technicalFindings} onChange={(e) => handleAssessmentFormChange('technicalFindings', e.target.value)} rows={3} className="form-textarea-enad" placeholder="Technical observations, electrical assessment, structural findings..." required /></div>
              </div>
            )}

            {activeTab === 'quotation' && (
              <div className="quotation-tab-enhanced">
                <div className="action-buttons-enad">
                  {selectedItem.assessmentStatus !== 'completed' && (
                    <button onClick={submitFinalReport} disabled={submitting} className="btn-success-enad">
                      {submitting ? <FaSpinner className="spinner-enad" /> : <FaCheckCircle />} Submit Final Report
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

                {assessmentResults && (
                  <div className="iot-metrics-section">
                    <h4>📊 IoT Monitoring Results (7-Day Data)</h4>
                    <div className="iot-metrics-grid">
                      <div className="metric-item"><FaSun /><div><label>Peak Sun Hours</label><span>{assessmentResults.peakSunHours?.toFixed(1) || '—'} hrs/day</span></div></div>
                      <div className="metric-item"><FaPercent /><div><label>Shading Percentage</label><span>{assessmentResults.shadingPercentage?.toFixed(0) || '—'}%</span></div></div>
                      <div className="metric-item"><FaThermometerHalf /><div><label>Avg Temperature</label><span>{assessmentResults.averageTemperature?.toFixed(1) || '—'}°C</span></div></div>
                      <div className="metric-item"><FaTint /><div><label>Avg Humidity</label><span>{assessmentResults.averageHumidity?.toFixed(0) || '—'}%</span></div></div>
                      <div className="metric-item"><FaChartLine /><div><label>Temp Derating</label><span>{systemMetrics?.temperatureDerating || '—'}%</span></div></div>
                      <div className="metric-item"><FaLocation /><div><label>GPS Location</label><span>{assessmentResults.gpsCoordinates?.latitude && assessmentResults.gpsCoordinates?.longitude ? `${assessmentResults.gpsCoordinates.latitude.toFixed(4)}, ${assessmentResults.gpsCoordinates.longitude.toFixed(4)}` : 'Not available'}</span></div></div>
                    </div>
                  </div>
                )}

                {systemMetrics && (
                  <>
                    <div className="system-recommendations">
                      <h4>🎯 System Recommendation (Based on IoT Data)</h4>
                      <div className="recommendations-grid">
                        <div className="rec-item"><label>Recommended System Size</label><strong>{systemMetrics.recommendedSystemSize} kWp</strong></div>
                        <div className="rec-item"><label>Number of Panels Needed</label><strong>{systemMetrics.panelsNeeded} pcs</strong></div>
                        <div className="rec-item"><label>Inverter Size</label><strong>{systemMetrics.inverterSize} kW</strong></div>
                        <div className="rec-item"><label>Performance Ratio</label><strong>{systemMetrics.performanceRatio}%</strong></div>
                        <div className="rec-item"><label>Optimal Orientation</label><strong>{systemMetrics.optimalOrientation}</strong></div>
                        <div className="rec-item"><label>Optimal Tilt Angle</label><strong>{systemMetrics.optimalTilt}°</strong></div>
                        <div className="rec-item"><label>Available Roof Area</label><strong>{systemMetrics.availableRoofArea} m²</strong></div>
                        <div className="rec-item"><label>Est. Installation Time</label><strong>{systemMetrics.estimatedInstallationTime} days</strong></div>
                      </div>
                    </div>
                    <div className="financial-projections">
                      <h4>💰 Financial Projections</h4>
                      <div className="financial-grid">
                        <div className="fin-item"><label>Estimated Total Cost</label><strong>{formatCurrency(systemMetrics.estimatedTotalCost)}</strong></div>
                        <div className="fin-item"><label>Estimated Monthly Savings</label><strong>{formatCurrency(systemMetrics.estimatedMonthlySavings)}</strong></div>
                        <div className="fin-item"><label>Payback Period</label><strong>{systemMetrics.paybackPeriod} years</strong></div>
                        <div className="fin-item"><label>CO2 Offset</label><strong>{systemMetrics.co2Offset} kg/year</strong></div>
                        <div className="fin-item"><label>Annual Production</label><strong>{systemMetrics.annualProduction} kWh</strong></div>
                      </div>
                    </div>
                  </>
                )}

                {/* Basic Info */}
                <div className="quotation-section">
                  <h4>Basic Information</h4>
                  <div className="form-grid-enad">
                    <div className="form-group-enad"><label>Quotation Number</label><input type="text" value={quotationForm.quotationNumber} onChange={(e) => handleQuotationChange('quotationNumber', e.target.value)} /></div>
                    <div className="form-group-enad"><label>Expiry Date (30 Days)</label><input type="date" value={quotationForm.quotationExpiryDate} onChange={(e) => handleQuotationChange('quotationExpiryDate', e.target.value)} /></div>
                    <div className="form-group-enad"><label>System Type</label><select value={quotationForm.systemType} onChange={(e) => handleQuotationChange('systemType', e.target.value)}>{SYSTEM_TYPES.map(type => (<option key={type.value} value={type.value}>{type.label}</option>))}</select></div>
                    <div className="form-group-enad"><label>System Size (kWp)</label><input type="number" step="0.5" value={quotationForm.systemSize} onChange={(e) => handleQuotationChange('systemSize', parseFloat(e.target.value))} placeholder="e.g., 5.0" /></div>
                  </div>
                </div>

                {/* Solar Panels */}
                <div className="quotation-section">
                  <h4><FaSolarPanel /> Solar Panels</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select value={selectedPanel?._id || ''} onChange={(e) => { const panel = availablePanels.find(p => p._id === e.target.value); setSelectedPanel(panel); if (panel && panel.unit === 'watt') setPanelQuantity(1); }}>
                        <option value="">-- Select Panel --</option>
                        {availablePanels.filter(p => p.isActive).map(panel => (<option key={panel._id} value={panel._id}>{panel.name} - {panel.brand} - ₱{panel.price.toLocaleString()}/{panel.unit}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}><input type="number" min="1" value={panelQuantity} onChange={(e) => setPanelQuantity(parseInt(e.target.value) || 0)} disabled={selectedPanel?.unit === 'watt'} /></div>
                    <div className="cost-display"><label>Panel Cost</label><div className="cost-value">{formatCurrency(calculatedCosts.panelCost)}</div></div>
                  </div>
                  {selectedPanel?.unit === 'watt' && <small className="form-hint">Price is per watt. Total calculated based on system size: {quotationForm.systemSize} kWp</small>}
                </div>

                {/* Inverters */}
                <div className="quotation-section">
                  <h4><FaBolt /> Inverters</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select value={selectedInverter?._id || ''} onChange={(e) => { const inverter = availableInverters.find(i => i._id === e.target.value); setSelectedInverter(inverter); }}>
                        <option value="">-- Select Inverter --</option>
                        {availableInverters.filter(i => i.isActive).map(inverter => (<option key={inverter._id} value={inverter._id}>{inverter.name} - {inverter.brand} - ₱{inverter.price.toLocaleString()}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}><input type="number" min="1" value={inverterQuantity} onChange={(e) => setInverterQuantity(parseInt(e.target.value) || 0)} /></div>
                    <div className="cost-display"><label>Inverter Cost</label><div className="cost-value">{formatCurrency(calculatedCosts.inverterCost)}</div></div>
                  </div>
                </div>

                {/* Batteries */}
                <div className="quotation-section">
                  <h4><FaBatteryFull /> Batteries (Optional)</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select value={selectedBattery?._id || ''} onChange={(e) => { const battery = availableBatteries.find(b => b._id === e.target.value); setSelectedBattery(battery); }}>
                        <option value="">-- No Battery --</option>
                        {availableBatteries.filter(b => b.isActive).map(battery => (<option key={battery._id} value={battery._id}>{battery.name} - {battery.brand} - ₱{battery.price.toLocaleString()}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}><input type="number" min="0" value={batteryQuantity} onChange={(e) => setBatteryQuantity(parseInt(e.target.value) || 0)} /></div>
                    <div className="cost-display"><label>Battery Cost</label><div className="cost-value">{formatCurrency(calculatedCosts.batteryCost)}</div></div>
                  </div>
                </div>

                {/* Mounting Structure */}
                <div className="quotation-section">
                  <h4><FaTools /> Mounting Structure</h4>
                  <div className="equipment-selection-row">
                    <div className="form-group-enad" style={{ flex: 2 }}>
                      <select value={selectedMountingStructure?._id || ''} onChange={(e) => { const structure = availableMountingStructures.find(m => m._id === e.target.value); setSelectedMountingStructure(structure); }}>
                        <option value="">-- Select Mounting Structure --</option>
                        {availableMountingStructures.filter(m => m.isActive).map(structure => (<option key={structure._id} value={structure._id}>{structure.name} - {structure.brand} - ₱{structure.price.toLocaleString()}/{structure.unit}</option>))}
                      </select>
                    </div>
                    <div className="form-group-enad" style={{ flex: 1 }}><input type="number" min="1" value={mountingStructureQuantity} onChange={(e) => setMountingStructureQuantity(parseInt(e.target.value) || 0)} /></div>
                    <div className="cost-display"><label>Mounting Cost</label><div className="cost-value">{formatCurrency(calculatedCosts.mountingCost)}</div></div>
                  </div>
                </div>

                {/* Electrical Components */}
                <div className="quotation-section">
                  <h4><FaBolt /> Electrical Components</h4>
                  <button type="button" className="btn-add-item" onClick={addElectricalComponent}><FaPlus /> Add Component</button>
                  {selectedElectricalComponents.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select value={item.id || ''} onChange={(e) => updateElectricalComponent(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Component --</option>
                        {availableElectricalComponents.filter(c => c.isActive).map(comp => (
                          <option key={comp._id} value={comp._id}>{comp.name} - ₱{comp.price.toLocaleString()}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateElectricalComponent(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeElectricalComponent(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Cables */}
                <div className="quotation-section">
                  <h4><FaWifi /> Cables and Wiring</h4>
                  <button type="button" className="btn-add-item" onClick={addCable}><FaPlus /> Add Cable</button>
                  {selectedCables.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select value={item.id || ''} onChange={(e) => updateCable(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Cable Type --</option>
                        {availableCables.filter(c => c.isActive).map(cable => (
                          <option key={cable._id} value={cable._id}>{cable.name} - ₱{cable.price.toLocaleString()}/{cable.unit}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Length (m)" value={item.length} onChange={(e) => updateCable(index, 'length', parseFloat(e.target.value) || 0)} style={{ width: '100px' }} />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateCable(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeCable(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Junction Boxes */}
                <div className="quotation-section">
                  <h4><FaBoxes /> Junction Boxes</h4>
                  <button type="button" className="btn-add-item" onClick={addJunctionBox}><FaPlus /> Add Junction Box</button>
                  {selectedJunctionBoxes.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select value={item.id || ''} onChange={(e) => updateJunctionBox(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Junction Box --</option>
                        {availableJunctionBoxes.filter(j => j.isActive).map(box => (
                          <option key={box._id} value={box._id}>{box.name} - ₱{box.price.toLocaleString()}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateJunctionBox(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeJunctionBox(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Disconnect Switches */}
                <div className="quotation-section">
                  <h4><FaServer /> Disconnect Switches</h4>
                  <button type="button" className="btn-add-item" onClick={addDisconnectSwitch}><FaPlus /> Add Switch</button>
                  {selectedDisconnectSwitches.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select value={item.id || ''} onChange={(e) => updateDisconnectSwitch(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Switch --</option>
                        {availableDisconnectSwitches.filter(s => s.isActive).map(sw => (
                          <option key={sw._id} value={sw._id}>{sw.name} - ₱{sw.price.toLocaleString()}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateDisconnectSwitch(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeDisconnectSwitch(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Meters */}
                <div className="quotation-section">
                  <h4><FaChartBar /> Meters</h4>
                  <button type="button" className="btn-add-item" onClick={addMeter}><FaPlus /> Add Meter</button>
                  {selectedMeters.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <select value={item.id || ''} onChange={(e) => updateMeter(index, 'id', e.target.value)} style={{ flex: 2 }}>
                        <option value="">-- Select Meter --</option>
                        {availableMeters.filter(m => m.isActive).map(meter => (
                          <option key={meter._id} value={meter._id}>{meter.name} - ₱{meter.price.toLocaleString()}</option>
                        ))}
                      </select>
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateMeter(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeMeter(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Additional Equipment */}
                <div className="quotation-section">
                  <h4>Additional Equipment</h4>
                  <button type="button" className="btn-add-item" onClick={addAdditionalEquipment}><FaPlus /> Add Custom Item</button>
                  {additionalEquipment.map((item, index) => (
                    <div key={index} className="additional-item-row">
                      <input type="text" placeholder="Item name" value={item.name} onChange={(e) => updateAdditionalEquipment(index, 'name', e.target.value)} style={{ flex: 2 }} />
                      <input type="number" placeholder="Qty" value={item.quantity} onChange={(e) => updateAdditionalEquipment(index, 'quantity', parseInt(e.target.value) || 0)} style={{ width: '80px' }} />
                      <input type="number" placeholder="Price" value={item.price} onChange={(e) => updateAdditionalEquipment(index, 'price', parseFloat(e.target.value) || 0)} style={{ width: '120px' }} />
                      <span className="item-total">{formatCurrency(item.total || 0)}</span>
                      <button type="button" className="btn-remove" onClick={() => removeAdditionalEquipment(index)}><FaTrash /></button>
                    </div>
                  ))}
                </div>

                {/* Installation Labor */}
                <div className="quotation-section">
                  <h4><FaHardHat /> Installation Labor</h4>
                  <div className="labor-calculation">
                    <div className="labor-detail">
                      <span>Per kW installation ({quotationForm.systemSize || 0} kW x ₱{config?.laborRates?.perKw || 5000})</span>
                      <span>{formatCurrency((quotationForm.systemSize || 0) * (config?.laborRates?.perKw || 5000))}</span>
                    </div>
                    <div className="labor-detail">
                      <span>Per panel installation ({panelQuantity} panels x ₱{config?.laborRates?.perPanel || 1000})</span>
                      <span>{formatCurrency(panelQuantity * (config?.laborRates?.perPanel || 1000))}</span>
                    </div>
                    <div className="labor-total">
                      <strong>Total Labor Cost</strong>
                      <strong>{formatCurrency(calculatedCosts.installationLaborCost)}</strong>
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
                  <div className="summary-row"><span>Cables & Wiring:</span><span>{formatCurrency(calculatedCosts.cableCost)}</span></div>
                  <div className="summary-row"><span>Junction Boxes:</span><span>{formatCurrency(calculatedCosts.junctionBoxCost)}</span></div>
                  <div className="summary-row"><span>Disconnect Switches:</span><span>{formatCurrency(calculatedCosts.disconnectSwitchCost)}</span></div>
                  <div className="summary-row"><span>Meters:</span><span>{formatCurrency(calculatedCosts.meterCost)}</span></div>
                  <div className="summary-row"><span>Additional Equipment:</span><span>{formatCurrency(calculatedCosts.additionalCost)}</span></div>
                  <div className="summary-row"><span>Equipment Total:</span><span>{formatCurrency(calculatedCosts.totalEquipmentCost)}</span></div>
                  <div className="summary-row"><span>Installation Labor:</span><span>{formatCurrency(calculatedCosts.installationLaborCost)}</span></div>
                  <div className="summary-row total"><span>TOTAL SYSTEM COST:</span><span>{formatCurrency(calculatedCosts.totalSystemCost)}</span></div>
                </div>

                {/* Payment Terms */}
                <div className="form-group-enad">
                  <label>Payment Terms</label>
                  <textarea value={quotationForm.paymentTerms} onChange={(e) => handleQuotationChange('paymentTerms', e.target.value)} rows={3} placeholder="e.g., 30% down payment, 70% upon completion" />
                </div>

                <div className="action-buttons-enad" style={{ marginTop: '20px' }}>
                  <button onClick={generateQuotationPDF} disabled={generatingPDF || !quotationForm.systemSize || calculatedCosts.totalSystemCost === 0} className="btn-primary-enad">
                    {generatingPDF ? <FaSpinner className="spinner-enad" /> : <FaFilePdf />} Generate & Upload PDF
                  </button>
                </div>
              </div>
            )}

            {/* Documents Tab */}
            {activeTab === 'documents' && (
              <div><div className="action-buttons-enad"><button onClick={() => setShowImageUploader(!showImageUploader)} className="btn-primary-enad"><FaCamera /> Upload Photos</button></div>{showImageUploader && (<div className="file-upload-enad"><input type="file" accept="image/*" multiple onChange={handleImageUpload} disabled={uploading} className="file-upload-input-enad" />{uploading && (<div className="uploading-enad"><FaSpinner className="spinner-enad" /> Uploading images...</div>)}</div>)}<div className="image-grid-enad">{siteImages.map((image, idx) => (<div key={idx} className="image-card-enad"><img src={image} alt={`Site photo ${idx + 1}`} /><div className="image-overlay-enad"><a href={image} target="_blank" rel="noopener noreferrer" className="image-overlay-icon-enad"><FaEye /></a></div></div>))}</div>{siteImages.length === 0 && (<div className="empty-state-enad"><FaImages className="empty-icon-enad" /><p>No photos uploaded yet</p></div>)}</div>
            )}

            {/* Comments Tab */}
            {activeTab === 'comments' && (
              <div><div className="comment-input-wrapper-enad"><textarea value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add a comment..." rows={3} className="comment-textarea-enad" /><button onClick={addComment} disabled={submitting || !commentText.trim()} className="comment-send-btn-enad"><FaPaperPlane /> Send</button></div><div className="comment-list-enad">{selectedItem.engineerComments?.length === 0 && (<div className="empty-state-enad"><p>No comments yet</p></div>)}{selectedItem.engineerComments?.map((comment, idx) => (<div key={idx} className="comment-item-enad"><div className="comment-header-enad"><div className="comment-user-enad"><div className="comment-avatar-enad"><FaUser /></div><div><p className="comment-name-enad">{comment.commentedBy?.firstName} {comment.commentedBy?.lastName}</p><p className="comment-time-enad">{formatDateTime(comment.commentedAt)}</p></div></div>{comment.isPublic && <span className="comment-badge-enad">Public</span>}</div><p className="comment-text-enad">{comment.comment}</p></div>))}</div></div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default MyAssessments;