// models/SystemConfig.js
const mongoose = require('mongoose');

// Sub-schema for equipment items
const equipmentItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  brand: { type: String, default: '' },
  model: { type: String, default: '' },
  warranty: { type: Number, default: 0 },
  unit: { type: String, default: 'piece' },
  isActive: { type: Boolean, default: true },
  notes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Define roof type sub-schema
const roofTypeSchema = new mongoose.Schema({
  multiplier: { type: Number, default: 1 },
  installationDifficulty: { 
    type: String, 
    enum: ['easy', 'moderate', 'complex'], 
    default: 'moderate' 
  }
});

const systemConfigSchema = new mongoose.Schema({
  assessmentFee: { type: Number, default: 1500 },
  
  equipmentPrices: {
    solarPanels: { type: [equipmentItemSchema], default: [] },
    inverters: { type: [equipmentItemSchema], default: [] },
    batteries: { type: [equipmentItemSchema], default: [] },
    mountingStructures: { type: [equipmentItemSchema], default: [] },
    electricalComponents: { type: [equipmentItemSchema], default: [] },
    cablesAndWiring: { type: [equipmentItemSchema], default: [] },
    safetyEquipment: { type: [equipmentItemSchema], default: [] },
    junctionBoxes: { type: [equipmentItemSchema], default: [] },
    disconnectSwitches: { type: [equipmentItemSchema], default: [] },
    meters: { type: [equipmentItemSchema], default: [] }
  },
  
  laborRates: {
    perKw: { type: Number, default: 5000 },
    perPanel: { type: Number, default: 1000 },
    minimumFee: { type: Number, default: 10000 },
    complexityMultiplier: {
      simple: { type: Number, default: 1 },
      moderate: { type: Number, default: 1.2 },
      complex: { type: Number, default: 1.5 }
    },
    hourlyRate: { type: Number, default: 500 },
    electricianRate: { type: Number, default: 800 },
    helperRate: { type: Number, default: 400 }
  },
  
  systemCalculations: {
    averageSunHours: { type: Number, default: 4.5 },
    systemLosses: { type: Number, default: 0.2 },
    deratingFactor: { type: Number, default: 0.77 },
    panelEfficiency: { type: Number, default: 0.18 },
    inverterEfficiency: { type: Number, default: 0.96 },
    batteryEfficiency: { type: Number, default: 0.85 },
    cableLossFactor: { type: Number, default: 0.03 },
    temperatureDerating: { type: Number, default: 0.88 }
  },
  
  materialMultipliers: {
    cablesPerKw: { type: Number, default: 15 },
    connectorsPerPanel: { type: Number, default: 2 },
    mountingRailsPerPanel: { type: Number, default: 2 }
  },
  
  financialParams: {
    electricityRate: { type: Number, default: 11.5 },
    inflationRate: { type: Number, default: 0.03 },
    discountRate: { type: Number, default: 0.08 },
    systemLifespan: { type: Number, default: 25 },
    warrantyPeriod: { type: Number, default: 10 },
    paybackTargetYears: { type: Number, default: 7 },
    netMeteringCreditRate: { type: Number, default: 8.5 }
  },
  
  taxesAndFees: {
    vatRate: { type: Number, default: 0.12 },
    withholdingTax: { type: Number, default: 0.01 },
    permitFee: { type: Number, default: 3000 },
    netMeteringFee: { type: Number, default: 5000 },
    deliveryCharge: { type: Number, default: 2000 },
    engineeringFee: { type: Number, default: 5000 },
    inspectionFee: { type: Number, default: 2500 }
  },
  
  thresholds: {
    smallSystem: { type: Number, default: 3 },
    mediumSystem: { type: Number, default: 7 },
    largeSystem: { type: Number, default: 12 },
    maxRecommendedSystem: { type: Number, default: 50 },
    minBatteryCapacity: { type: Number, default: 2.4 },
    maxBatteryCapacity: { type: Number, default: 20 }
  },
  
  defaultSystemTypes: {
    gridTie: {
      name: { type: String, default: 'Grid-Tie System' },
      basePrice: { type: Number, default: 50000 },
      description: { type: String, default: 'Connected to utility grid, no batteries' }
    },
    hybrid: {
      name: { type: String, default: 'Hybrid System' },
      basePrice: { type: Number, default: 80000 },
      description: { type: String, default: 'Grid-tie with battery backup' }
    },
    offGrid: {
      name: { type: String, default: 'Off-Grid System' },
      basePrice: { type: Number, default: 100000 },
      description: { type: String, default: 'Standalone with batteries' }
    }
  },
  
  roofTypes: {
    concrete: { type: roofTypeSchema, default: () => ({ multiplier: 1, installationDifficulty: 'moderate' }) },
    metal: { type: roofTypeSchema, default: () => ({ multiplier: 1.1, installationDifficulty: 'easy' }) },
    tile: { type: roofTypeSchema, default: () => ({ multiplier: 1.3, installationDifficulty: 'complex' }) },
    other: { type: roofTypeSchema, default: () => ({ multiplier: 1.2, installationDifficulty: 'moderate' }) }
  },
  
  maintenanceSettings: {
    autoBackupEnabled: { type: Boolean, default: true },
    backupFrequency: { type: String, default: 'daily' },
    dataRetentionDays: { type: Number, default: 90 },
    logRetentionDays: { type: Number, default: 30 },
    recommendedCleaningFrequency: { type: Number, default: 6 },
    inspectionInterval: { type: Number, default: 12 }
  },
  
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    lowInventoryAlert: { type: Number, default: 5 },
    deviceOfflineAlert: { type: Number, default: 2 }
  },
  
  lastUpdatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  lastUpdatedAt: { type: Date, default: Date.now },
  updateHistory: [{
    field: String,
    oldValue: mongoose.Schema.Types.Mixed,
    newValue: mongoose.Schema.Types.Mixed,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
    reason: String
  }]
}, { timestamps: true });

// ❌ REMOVED pre-save middleware completely

// Static method to initialize default data
systemConfigSchema.statics.initializeDefaults = async function() {
  let config = await this.findOne();
  
  if (!config) {
    config = new this();
  }
  
  let needsSave = false;
  
  // Initialize solar panels if empty
  if (config.equipmentPrices.solarPanels.length === 0) {
    config.equipmentPrices.solarPanels = [
      { name: 'Longi 540W Monocrystalline', price: 14500, brand: 'Longi', warranty: 25, unit: 'piece', isActive: true },
      { name: 'Jinko 550W Tiger Pro', price: 15800, brand: 'Jinko Solar', warranty: 25, unit: 'piece', isActive: true },
      { name: 'Trina 545W Vertex S', price: 15200, brand: 'Trina Solar', warranty: 25, unit: 'piece', isActive: true }
    ];
    needsSave = true;
  }
  
  // Initialize inverters if empty
  if (config.equipmentPrices.inverters.length === 0) {
    config.equipmentPrices.inverters = [
      { name: 'Growatt 5kW Grid-Tie', price: 35000, brand: 'Growatt', warranty: 10, unit: 'piece', isActive: true },
      { name: 'Solis 5kW Grid-Tie', price: 32000, brand: 'Solis', warranty: 10, unit: 'piece', isActive: true },
      { name: 'Huawei 5kW Hybrid', price: 68000, brand: 'Huawei', warranty: 12, unit: 'piece', isActive: true }
    ];
    needsSave = true;
  }
  
  // Initialize batteries if empty
  if (config.equipmentPrices.batteries.length === 0) {
    config.equipmentPrices.batteries = [
      { name: 'Pylontech 2.4kWh Lithium', price: 28000, brand: 'Pylontech', warranty: 10, unit: 'piece', isActive: true },
      { name: 'Dyness 5kWh Lithium', price: 55000, brand: 'Dyness', warranty: 10, unit: 'piece', isActive: true }
    ];
    needsSave = true;
  }
  
  // Initialize mounting structures if empty
  if (config.equipmentPrices.mountingStructures.length === 0) {
    config.equipmentPrices.mountingStructures = [
      { name: 'Roof Mount Rail Kit', price: 3500, brand: 'Standard', warranty: 15, unit: 'set', isActive: true },
      { name: 'Ground Mount Structure 5kW', price: 18000, brand: 'Standard', warranty: 20, unit: 'set', isActive: true }
    ];
    needsSave = true;
  }
  
  // Initialize electrical components if empty
  if (config.equipmentPrices.electricalComponents.length === 0) {
    config.equipmentPrices.electricalComponents = [
      { name: 'MC4 Connector Pair', price: 250, brand: 'Staubli', warranty: 10, unit: 'pair', isActive: true },
      { name: 'DC Breaker 2P 20A', price: 450, brand: 'Schneider', warranty: 5, unit: 'piece', isActive: true }
    ];
    needsSave = true;
  }
  
  // Initialize cables if empty
  if (config.equipmentPrices.cablesAndWiring.length === 0) {
    config.equipmentPrices.cablesAndWiring = [
      { name: 'PV Wire 6mm² (per meter)', price: 95, brand: 'Standard', warranty: 10, unit: 'meter', isActive: true }
    ];
    needsSave = true;
  }
  
  // Initialize safety equipment if empty
  if (config.equipmentPrices.safetyEquipment.length === 0) {
    config.equipmentPrices.safetyEquipment = [
      { name: 'Safety Harness', price: 3500, brand: '3M', warranty: 3, unit: 'piece', isActive: true }
    ];
    needsSave = true;
  }
  
  // Initialize junction boxes if empty
  if (config.equipmentPrices.junctionBoxes.length === 0) {
    config.equipmentPrices.junctionBoxes = [
      { name: 'PV String Combiner Box 4-in', price: 2800, brand: 'Standard', warranty: 10, unit: 'piece', isActive: true }
    ];
    needsSave = true;
  }
  
  // Initialize disconnect switches if empty
  if (config.equipmentPrices.disconnectSwitches.length === 0) {
    config.equipmentPrices.disconnectSwitches = [
      { name: 'DC Disconnect Switch 600V', price: 2200, brand: 'IMO', warranty: 10, unit: 'piece', isActive: true }
    ];
    needsSave = true;
  }
  
  // Initialize meters if empty
  if (config.equipmentPrices.meters.length === 0) {
    config.equipmentPrices.meters = [
      { name: 'Bi-directional Meter', price: 5500, brand: 'Landis+Gyr', warranty: 5, unit: 'piece', isActive: true }
    ];
    needsSave = true;
  }
  
  if (needsSave) {
    await config.save();
  }
  
  return config;
};

// Method to add equipment item
systemConfigSchema.methods.addEquipmentItem = async function(type, itemData, userId, reason) {
  const validTypes = [
    'solarPanels', 'inverters', 'batteries', 'mountingStructures',
    'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
    'junctionBoxes', 'disconnectSwitches', 'meters'
  ];
  
  if (!validTypes.includes(type)) {
    throw new Error('Invalid equipment type');
  }
  
  const newItem = {
    ...itemData,
    _id: new mongoose.Types.ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };
  
  this.equipmentPrices[type].push(newItem);
  
  this.updateHistory.push({
    field: `equipmentPrices.${type}`,
    oldValue: null,
    newValue: newItem,
    updatedBy: userId,
    reason: reason || `Added new ${type.slice(0, -1)}: ${itemData.name}`,
    updatedAt: new Date()
  });
  
  this.lastUpdatedBy = userId;
  this.lastUpdatedAt = new Date();
  
  await this.save();
  return newItem;
};

// Method to update equipment item
systemConfigSchema.methods.updateEquipmentItem = async function(type, itemId, updates, userId, reason) {
  const typeMap = {
    solarPanels: this.equipmentPrices.solarPanels,
    inverters: this.equipmentPrices.inverters,
    batteries: this.equipmentPrices.batteries,
    mountingStructures: this.equipmentPrices.mountingStructures,
    electricalComponents: this.equipmentPrices.electricalComponents,
    cablesAndWiring: this.equipmentPrices.cablesAndWiring,
    safetyEquipment: this.equipmentPrices.safetyEquipment,
    junctionBoxes: this.equipmentPrices.junctionBoxes,
    disconnectSwitches: this.equipmentPrices.disconnectSwitches,
    meters: this.equipmentPrices.meters
  };
  
  const items = typeMap[type];
  if (!items) throw new Error('Invalid equipment type');
  
  const itemIndex = items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) throw new Error('Item not found');
  
  const oldItem = { ...items[itemIndex].toObject() };
  
  Object.assign(items[itemIndex], updates, { updatedAt: new Date() });
  
  this.updateHistory.push({
    field: `equipmentPrices.${type}`,
    oldValue: oldItem,
    newValue: items[itemIndex],
    updatedBy: userId,
    reason: reason || `Updated ${type.slice(0, -1)}: ${items[itemIndex].name}`,
    updatedAt: new Date()
  });
  
  this.lastUpdatedBy = userId;
  this.lastUpdatedAt = new Date();
  
  await this.save();
  return items[itemIndex];
};

// Method to remove equipment item (soft delete)
systemConfigSchema.methods.removeEquipmentItem = async function(type, itemId, userId, reason) {
  const typeMap = {
    solarPanels: this.equipmentPrices.solarPanels,
    inverters: this.equipmentPrices.inverters,
    batteries: this.equipmentPrices.batteries,
    mountingStructures: this.equipmentPrices.mountingStructures,
    electricalComponents: this.equipmentPrices.electricalComponents,
    cablesAndWiring: this.equipmentPrices.cablesAndWiring,
    safetyEquipment: this.equipmentPrices.safetyEquipment,
    junctionBoxes: this.equipmentPrices.junctionBoxes,
    disconnectSwitches: this.equipmentPrices.disconnectSwitches,
    meters: this.equipmentPrices.meters
  };
  
  const items = typeMap[type];
  if (!items) throw new Error('Invalid equipment type');
  
  const itemIndex = items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) throw new Error('Item not found');
  
  const removedItem = items[itemIndex];
  
  // Soft delete
  removedItem.isActive = false;
  removedItem.updatedAt = new Date();
  
  this.updateHistory.push({
    field: `equipmentPrices.${type}`,
    oldValue: removedItem,
    newValue: { ...removedItem.toObject(), isActive: false },
    updatedBy: userId,
    reason: reason || `Removed ${type.slice(0, -1)}: ${removedItem.name}`,
    updatedAt: new Date()
  });
  
  this.lastUpdatedBy = userId;
  this.lastUpdatedAt = new Date();
  
  await this.save();
  return removedItem;
};

// Method to hard delete equipment item
systemConfigSchema.methods.hardDeleteEquipmentItem = async function(type, itemId, userId, reason) {
  const typeMap = {
    solarPanels: this.equipmentPrices.solarPanels,
    inverters: this.equipmentPrices.inverters,
    batteries: this.equipmentPrices.batteries,
    mountingStructures: this.equipmentPrices.mountingStructures,
    electricalComponents: this.equipmentPrices.electricalComponents,
    cablesAndWiring: this.equipmentPrices.cablesAndWiring,
    safetyEquipment: this.equipmentPrices.safetyEquipment,
    junctionBoxes: this.equipmentPrices.junctionBoxes,
    disconnectSwitches: this.equipmentPrices.disconnectSwitches,
    meters: this.equipmentPrices.meters
  };
  
  const items = typeMap[type];
  if (!items) throw new Error('Invalid equipment type');
  
  const itemIndex = items.findIndex(item => item._id.toString() === itemId);
  if (itemIndex === -1) throw new Error('Item not found');
  
  const removedItem = items[itemIndex];
  items.splice(itemIndex, 1);
  
  this.updateHistory.push({
    field: `equipmentPrices.${type}`,
    oldValue: removedItem,
    newValue: null,
    updatedBy: userId,
    reason: reason || `Hard deleted ${type.slice(0, -1)}: ${removedItem.name}`,
    updatedAt: new Date()
  });
  
  this.lastUpdatedBy = userId;
  this.lastUpdatedAt = new Date();
  
  await this.save();
  return removedItem;
};

// Method to update config
systemConfigSchema.methods.updateConfig = async function(updates, userId, reason) {
  const history = [];
  
  for (const [key, value] of Object.entries(updates)) {
    const oldValue = this[key];
    if (JSON.stringify(oldValue) !== JSON.stringify(value)) {
      history.push({
        field: key,
        oldValue: oldValue,
        newValue: value,
        updatedBy: userId,
        reason: reason
      });
      this[key] = value;
    }
  }
  
  this.updateHistory.push(...history);
  this.lastUpdatedBy = userId;
  this.lastUpdatedAt = new Date();
  
  await this.save();
  return { history, updated: history.length };
};

module.exports = mongoose.model('SystemConfig', systemConfigSchema);