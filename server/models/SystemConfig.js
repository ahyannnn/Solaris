// models/SystemConfig.js
const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
  // ============ PRICE CONFIGURATION ============
  assessmentFee: {
    type: Number,
    default: 1500,
    description: 'Pre-assessment booking fee'
  },
  
  // Equipment Prices
  equipmentPrices: {
    solarPanel: {
      pricePerWatt: { type: Number, default: 25 },
      brand: { type: String, default: 'Standard' },
      warranty: { type: Number, default: 25 }
    },
    inverter: {
      gridTie: { type: Number, default: 15000 },
      hybrid: { type: Number, default: 25000 },
      offGrid: { type: Number, default: 20000 }
    },
    battery: {
      leadAcid: { type: Number, default: 8000 },
      lithium: { type: Number, default: 15000 },
      capacity: { type: Number, default: 100 }
    },
    mountingStructure: {
      roofMount: { type: Number, default: 5000 },
      groundMount: { type: Number, default: 8000 }
    },
    wiringAndElectrical: {
      standard: { type: Number, default: 3000 },
      premium: { type: Number, default: 5000 }
    }
  },
  
  // Installation Labor Rates
  laborRates: {
    perKw: { type: Number, default: 5000 },
    perPanel: { type: Number, default: 1000 },
    minimumFee: { type: Number, default: 10000 },
    complexityMultiplier: {
      simple: { type: Number, default: 1 },
      moderate: { type: Number, default: 1.2 },
      complex: { type: Number, default: 1.5 }
    }
  },
  
  // ============ CALCULATION PARAMETERS ============
  systemCalculations: {
    averageSunHours: { type: Number, default: 4.5 },
    systemLosses: { type: Number, default: 0.2 },
    deratingFactor: { type: Number, default: 0.77 },
    panelEfficiency: { type: Number, default: 0.18 },
    inverterEfficiency: { type: Number, default: 0.96 },
    batteryEfficiency: { type: Number, default: 0.85 }
  },
  
  // Financial Calculations
  financialParams: {
    electricityRate: { type: Number, default: 11.5 },
    inflationRate: { type: Number, default: 0.03 },
    discountRate: { type: Number, default: 0.08 },
    systemLifespan: { type: Number, default: 25 },
    warrantyPeriod: { type: Number, default: 10 },
    paybackTargetYears: { type: Number, default: 7 }
  },
  
  // ============ TAXES AND FEES ============
  taxesAndFees: {
    vatRate: { type: Number, default: 0.12 },
    withholdingTax: { type: Number, default: 0.01 },
    permitFee: { type: Number, default: 3000 },
    netMeteringFee: { type: Number, default: 5000 },
    deliveryCharge: { type: Number, default: 2000 }
  },
  
  // ============ SYSTEM THRESHOLDS ============
  thresholds: {
    smallSystem: { type: Number, default: 3 },
    mediumSystem: { type: Number, default: 7 },
    largeSystem: { type: Number, default: 12 },
    maxRecommendedSystem: { type: Number, default: 50 }
  },
  
  // ============ DEFAULT SYSTEM TYPES ============
  // Fixed: Changed from nested objects to simple fields
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
  
  // ============ ROOF TYPES ============
  roofTypes: {
    concrete: { multiplier: { type: Number, default: 1 } },
    metal: { multiplier: { type: Number, default: 1.1 } },
    tile: { multiplier: { type: Number, default: 1.3 } },
    other: { multiplier: { type: Number, default: 1.2 } }
  },
  
  // ============ MAINTENANCE SETTINGS ============
  maintenanceSettings: {
    autoBackupEnabled: { type: Boolean, default: true },
    backupFrequency: { type: String, default: 'daily' },
    dataRetentionDays: { type: Number, default: 90 },
    logRetentionDays: { type: Number, default: 30 }
  },
  
  // ============ NOTIFICATION SETTINGS ============
  notificationSettings: {
    emailNotifications: { type: Boolean, default: true },
    smsNotifications: { type: Boolean, default: false },
    lowInventoryAlert: { type: Number, default: 5 },
    deviceOfflineAlert: { type: Number, default: 2 }
  },
  
  // ============ AUDIT FIELDS ============
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
}, {
  timestamps: true
});

// Method to update configuration with history tracking
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