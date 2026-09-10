// controllers/maintenanceController.js
const Maintenance = require('../models/Maintenance');
const SystemConfig = require('../models/SystemConfig');
const MaintenanceTask = require('../models/MaintenanceTask');
const AuditLog = require('../models/AuditLog');
const PreAssessment = require('../models/PreAssessment');
const FreeQuote = require('../models/FreeQuote');
const SolarInvoice = require('../models/SolarInvoice');
const BankTransferPayment = require('../models/BankTransferPayment');
const Project = require('../models/Project');
const axios = require('axios');

// Helper function to generate task ID
const generateTaskId = () => {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `MT-${year}${month}${day}-${random}`;
};

// @desc    Get maintenance status
// @route   GET /api/maintenance/status
// @access  Public
exports.getMaintenanceStatus = async (req, res) => {
  try {
    let maintenance = await Maintenance.findOne();

    if (!maintenance) {
      maintenance = new Maintenance();
      await maintenance.save();
    }

    res.json({
      success: true,
      isUnderMaintenance: maintenance.isUnderMaintenance,
      title: maintenance.title,
      message: maintenance.message,
      estimatedDuration: maintenance.estimatedDuration,
      scheduledStart: maintenance.scheduledStart,
      scheduledEnd: maintenance.scheduledEnd,
      showCountdown: maintenance.showCountdown,
      showProgressBar: maintenance.showProgressBar,
      contactEmail: maintenance.contactEmail,
      contactPhone: maintenance.contactPhone,
      socialLinks: maintenance.socialLinks,
      // ADD THESE MISSING FIELDS:
      allowedIPs: maintenance.allowedIPs || [],           // <-- ADD THIS
      allowedRoles: maintenance.allowedRoles || ['admin'], // <-- ADD THIS
      whitelistedRoutes: maintenance.whitelistedRoutes || ['/api/auth/login', '/api/auth/register', '/api/maintenance/status'] // <-- ADD THIS
    });

  } catch (error) {
    console.error('Get maintenance status error:', error);
    res.status(500).json({ message: 'Failed to get maintenance status', error: error.message });
  }
};

// @desc    Enable maintenance mode (Admin only)
// @route   POST /api/maintenance/enable
// @access  Private (Admin)
exports.enableMaintenance = async (req, res) => {
  try {
    const { title, message, estimatedDuration, showCountdown, showProgressBar, contactEmail, contactPhone, socialLinks } = req.body;
    const adminId = req.user.id;

    let maintenance = await Maintenance.findOne();

    if (!maintenance) {
      maintenance = new Maintenance();
    }

    // Check if already under maintenance
    if (maintenance.isUnderMaintenance) {
      return res.status(400).json({
        success: false,
        message: 'Maintenance mode is already enabled. Please disable it first before enabling again.',
        isUnderMaintenance: true,
        startedAt: maintenance.scheduledStart
      });
    }

    await maintenance.startMaintenance(
      title || maintenance.title,
      message || maintenance.message,
      estimatedDuration || maintenance.estimatedDuration,
      req.user.id
    );

    // Update additional settings
    if (showCountdown !== undefined) maintenance.showCountdown = showCountdown;
    if (showProgressBar !== undefined) maintenance.showProgressBar = showProgressBar;
    if (contactEmail) maintenance.contactEmail = contactEmail;
    if (contactPhone) maintenance.contactPhone = contactPhone;
    if (socialLinks) maintenance.socialLinks = socialLinks;

    await maintenance.save();

    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: 'Maintenance Mode Enabled',
      description: `Maintenance mode enabled by ${req.user.name || req.user.id}`,
      type: 'system_config',
      taskData: { title, message, estimatedDuration },
      results: {
        success: true,
        message: 'Maintenance mode enabled successfully'
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });
    await task.save();

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: `Enabled maintenance mode${title ? `: ${title}` : ''}`
    });

    res.json({
      success: true,
      message: 'Maintenance mode enabled',
      maintenance: {
        isUnderMaintenance: maintenance.isUnderMaintenance,
        scheduledStart: maintenance.scheduledStart,
        title: maintenance.title,
        message: maintenance.message
      }
    });

  } catch (error) {
    console.error('Enable maintenance error:', error);
    res.status(500).json({ message: 'Failed to enable maintenance', error: error.message });
  }
};

// @desc    Disable maintenance mode (Admin only)
// @route   POST /api/maintenance/disable
// @access  Private (Admin)
exports.disableMaintenance = async (req, res) => {
  try {
    const adminId = req.user.id;
    let maintenance = await Maintenance.findOne();

    if (!maintenance) {
      maintenance = new Maintenance();
      await maintenance.save();
    }

    // Check if not under maintenance
    if (!maintenance.isUnderMaintenance) {
      return res.status(400).json({
        success: false,
        message: 'Maintenance mode is not currently enabled. Nothing to disable.',
        isUnderMaintenance: false
      });
    }

    await maintenance.endMaintenance(req.user.id);

    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: 'Maintenance Mode Disabled',
      description: `Maintenance mode disabled by ${req.user.name || req.user.id}`,
      type: 'system_config',
      results: {
        success: true,
        message: 'Maintenance mode disabled successfully'
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });
    await task.save();

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: "Disabled maintenance mode"
    });

    res.json({
      success: true,
      message: 'Maintenance mode disabled',
      maintenance: {
        isUnderMaintenance: maintenance.isUnderMaintenance,
        scheduledEnd: maintenance.scheduledEnd
      }
    });

  } catch (error) {
    console.error('Disable maintenance error:', error);
    res.status(500).json({ message: 'Failed to disable maintenance', error: error.message });
  }
};

// @desc    Update maintenance settings (Admin only)
// @route   PUT /api/maintenance/settings
// @access  Private (Admin)
exports.updateMaintenanceSettings = async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      title,
      message,
      estimatedDuration,
      allowedIPs,
      allowedRoles,
      whitelistedRoutes,
      showCountdown,
      showProgressBar,
      contactEmail,
      contactPhone,
      socialLinks
    } = req.body;

    let maintenance = await Maintenance.findOne();

    if (!maintenance) {
      maintenance = new Maintenance();
    }

    if (title) maintenance.title = title;
    if (message) maintenance.message = message;
    if (estimatedDuration) maintenance.estimatedDuration = estimatedDuration;
    if (allowedIPs) maintenance.allowedIPs = allowedIPs;
    if (allowedRoles) maintenance.allowedRoles = allowedRoles;
    if (whitelistedRoutes) maintenance.whitelistedRoutes = whitelistedRoutes;
    if (showCountdown !== undefined) maintenance.showCountdown = showCountdown;
    if (showProgressBar !== undefined) maintenance.showProgressBar = showProgressBar;
    if (contactEmail) maintenance.contactEmail = contactEmail;
    if (contactPhone) maintenance.contactPhone = contactPhone;
    if (socialLinks) maintenance.socialLinks = socialLinks;

    maintenance.updatedBy = req.user.id;
    maintenance.updatedAt = new Date();

    await maintenance.save();

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: "Updated maintenance settings"
    });

    res.json({
      success: true,
      message: 'Maintenance settings updated',
      maintenance
    });

  } catch (error) {
    console.error('Update maintenance settings error:', error);
    res.status(500).json({ message: 'Failed to update settings', error: error.message });
  }
};

// @desc    Get maintenance history (Admin only)
// @route   GET /api/maintenance/history
// @access  Private (Admin)
exports.getMaintenanceHistory = async (req, res) => {
  try {
    const maintenance = await Maintenance.findOne()
      .populate('maintenanceHistory.initiatedBy', 'firstName lastName email')
      .populate('maintenanceHistory.completedAt');

    if (!maintenance) {
      return res.json({ success: true, history: [] });
    }

    res.json({
      success: true,
      history: maintenance.maintenanceHistory
    });

  } catch (error) {
    console.error('Get maintenance history error:', error);
    res.status(500).json({ message: 'Failed to get history', error: error.message });
  }
};

// @desc    Add allowed IP (Admin only)
// @route   POST /api/maintenance/add-ip
// @access  Private (Admin)
exports.addAllowedIP = async (req, res) => {
  try {
    const { ip } = req.body;
    const adminId = req.user.id;

    if (!ip) {
      return res.status(400).json({ message: 'IP address is required' });
    }

    let maintenance = await Maintenance.findOne();

    if (!maintenance) {
      maintenance = new Maintenance();
    }

    if (!maintenance.allowedIPs.includes(ip)) {
      maintenance.allowedIPs.push(ip);
      await maintenance.save();
    }

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: `Added IP ${ip} to whitelist`
    });

    res.json({
      success: true,
      message: 'IP address added to whitelist',
      allowedIPs: maintenance.allowedIPs
    });

  } catch (error) {
    console.error('Add allowed IP error:', error);
    res.status(500).json({ message: 'Failed to add IP', error: error.message });
  }
};

// @desc    Remove allowed IP (Admin only)
// @route   DELETE /api/maintenance/remove-ip/:ip
// @access  Private (Admin)
exports.removeAllowedIP = async (req, res) => {
  try {
    const { ip } = req.params;
    const adminId = req.user.id;

    let maintenance = await Maintenance.findOne();

    if (!maintenance) {
      maintenance = new Maintenance();
    }

    maintenance.allowedIPs = maintenance.allowedIPs.filter(allowedIp => allowedIp !== ip);
    await maintenance.save();

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: `Removed IP ${ip} from whitelist`
    });

    res.json({
      success: true,
      message: 'IP address removed from whitelist',
      allowedIPs: maintenance.allowedIPs
    });

  } catch (error) {
    console.error('Remove allowed IP error:', error);
    res.status(500).json({ message: 'Failed to remove IP', error: error.message });
  }
};

// ============ SYSTEM CONFIGURATION FUNCTIONS ============

// @desc    Get public pre-assessment fee (for customer booking display)
// @route   GET /api/maintenance/public-fee
// @access  Public
exports.getPublicAssessmentFee = async (req, res) => {
  try {
    let config = await SystemConfig.findOne().select('assessmentFee');

    if (!config) {
      return res.json({ success: true, assessmentFee: 1500 });
    }

    res.json({
      success: true,
      assessmentFee: Number(config.assessmentFee) || 1500
    });
  } catch (error) {
    console.error('Get public assessment fee error:', error);
    res.json({ success: true, assessmentFee: 1500 });
  }
};

// Short in-memory cache so repeated admin views don't spam the Brevo API
let emailQuotaCache = { data: null, fetchedAt: 0 };
const EMAIL_QUOTA_CACHE_MS = 5 * 60 * 1000;
const BREVO_FREE_DAILY_LIMIT = 300;

// @desc    Get remaining Brevo email quota for today (free plan: 300/day, resets daily)
// @route   GET /api/maintenance/email-quota
// @access  Private (Admin)
exports.getEmailQuota = async (req, res) => {
  try {
    if (!process.env.BREVO_API_KEY) {
      return res.status(503).json({
        success: false,
        message: 'BREVO_API_KEY is not configured on the server'
      });
    }

    const now = Date.now();
    if (emailQuotaCache.data && (now - emailQuotaCache.fetchedAt) < EMAIL_QUOTA_CACHE_MS) {
      return res.json({ success: true, cached: true, ...emailQuotaCache.data });
    }

    const response = await axios.get('https://api.brevo.com/v3/account', {
      headers: { 'api-key': process.env.BREVO_API_KEY },
      timeout: 10000
    });

    const plans = response.data?.plan || [];
    // Prefer the free plan entry; fall back to any sendLimit entry
    const planEntry = plans.find(p => p.type === 'free' && p.creditsType === 'sendLimit')
      || plans.find(p => p.creditsType === 'sendLimit');

    if (!planEntry || planEntry.credits == null) {
      return res.status(503).json({
        success: false,
        message: 'Brevo did not return quota info for this account'
      });
    }

    const remaining = Math.max(0, Math.floor(Number(planEntry.credits)));
    const result = {
      remaining,
      used: Math.max(0, BREVO_FREE_DAILY_LIMIT - remaining),
      dailyLimit: BREVO_FREE_DAILY_LIMIT,
      plan: planEntry.type || 'free',
      resetsDaily: true
    };

    emailQuotaCache = { data: result, fetchedAt: now };
    res.json({ success: true, cached: false, ...result });
  } catch (error) {
    const brevoMsg = error.response?.data?.message;
    console.error('Get Brevo email quota error:', brevoMsg || error.message);
    res.status(503).json({
      success: false,
      message: brevoMsg || 'Failed to reach Brevo API'
    });
  }
};

// Short in-memory cache so repeated admin views don't spam the Cloudinary Admin API
// (rate-limited: 500 calls/hr on free plan — same 5-min window as the Brevo quota cache)
let cloudinaryQuotaCache = { data: null, fetchedAt: 0 };
const CLOUDINARY_QUOTA_CACHE_MS = 5 * 60 * 1000;

// @desc    Get Cloudinary credit quota (credits-only: remaining + used %, no assumed MB quota math)
// @route   GET /api/maintenance/cloudinary-quota
// @access  Private (Admin)
exports.getCloudinaryQuota = async (req, res) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME ||
        !process.env.CLOUDINARY_API_KEY ||
        !process.env.CLOUDINARY_API_SECRET) {
      return res.status(503).json({
        success: false,
        configured: false,
        message: 'Cloudinary is not configured on the server'
      });
    }

    const now = Date.now();
    if (cloudinaryQuotaCache.data && (now - cloudinaryQuotaCache.fetchedAt) < CLOUDINARY_QUOTA_CACHE_MS) {
      return res.json({ success: true, cached: true, configured: true, ...cloudinaryQuotaCache.data });
    }

    const cloudinary = require('cloudinary').v2;
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET
    });

    const usage = await Promise.race([
      cloudinary.api.usage(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('Cloudinary usage request timed out')), 10000))
    ]);

    const credits = usage?.credits || {};
    const creditsLimit = credits.limit != null ? Number(credits.limit) : null;
    const creditsUsed = credits.usage != null ? Number(credits.usage) : null;
    const usedPercent = credits.used_percent != null
      ? Number(credits.used_percent)
      : (creditsLimit && creditsUsed != null && creditsLimit > 0
        ? (creditsUsed / creditsLimit) * 100
        : null);
    const creditsRemaining = (creditsLimit != null && creditsUsed != null)
      ? Math.max(0, Math.round((creditsLimit - creditsUsed) * 100) / 100)
      : null;
    const storageBytes = usage?.storage?.usage != null ? Number(usage.storage.usage) : null;
    const storageUsedMB = storageBytes != null
      ? Math.round((storageBytes / (1024 * 1024)) * 10) / 10
      : null;
    // Bandwidth = delivered/viewed data TODAY (this is what eats credits without growing stored MB)
    const bandwidthBytes = usage?.bandwidth?.usage != null ? Number(usage.bandwidth.usage) : null;
    const bandwidthUsedMB = bandwidthBytes != null
      ? Math.round((bandwidthBytes / (1024 * 1024)) * 10) / 10
      : null;
    const bandwidthCredits = usage?.bandwidth?.credits_usage != null
      ? Math.round(Number(usage.bandwidth.credits_usage) * 100) / 100
      : null;
    const storageCredits = usage?.storage?.credits_usage != null
      ? Math.round(Number(usage.storage.credits_usage) * 100) / 100
      : null;
    const transformationCount = usage?.transformations?.usage != null
      ? Number(usage.transformations.usage)
      : null;
    const transformationCredits = usage?.transformations?.credits_usage != null
      ? Math.round(Number(usage.transformations.credits_usage) * 100) / 100
      : null;

    const result = {
      plan: usage?.plan || 'unknown',
      creditsUsed,
      creditsLimit,
      creditsRemaining,
      usedPercent: usedPercent != null ? Math.round(usedPercent * 100) / 100 : null,
      storageUsedMB,
      storageCredits,
      bandwidthUsedMB,
      bandwidthCredits,
      transformationCount,
      transformationCredits,
      lastUpdated: usage?.last_updated || null
    };

    cloudinaryQuotaCache = { data: result, fetchedAt: now };
    res.json({ success: true, cached: false, configured: true, ...result });
  } catch (error) {
    console.error('Get Cloudinary quota error:', error.error?.message || error.message);
    res.status(503).json({
      success: false,
      configured: true,
      message: error.error?.message || error.message || 'Failed to reach Cloudinary API'
    });
  }
};

// @desc    Count items waiting on admin action (sidebar badges for
//          Site Assessments + Billing). View-only states (details, receipts,
//          auto-verified, completed, customer-pending invoices, etc.) excluded.
// @route   GET /api/maintenance/action-counts
// @access  Private (Admin)
exports.getActionCounts = async (req, res) => {
  try {
    const [
      preAssessments,
      freeQuotesPending,
      invoicesToSend,
      invoicesToVerify,
      bankWaiting,
      projApprove,
      projAssign,
      projRecordProgress
    ] = await Promise.all([
      PreAssessment.countDocuments({
        $or: [
          // 1. Approve / Reject Booking
          { assessmentStatus: 'pending_review' },
          // 2. Verify Cash Payment
          { paymentMethod: 'cash', paymentStatus: 'pending' },
          // 3. Verify GCash Payment (manual proof, not yet auto-verified)
          {
            paymentMethod: 'gcash',
            paymentStatus: 'for_verification',
            paymentGateway: { $in: [null, ''] }
          },
          // 4. Assign Engineer & Device (null matches missing field too)
          {
            paymentStatus: 'paid',
            assessmentStatus: 'scheduled',
            assignedEngineerId: null
          },
          // 5. Process Refund
          {
            assessmentStatus: 'cancelled',
            'cancellation.refundStatus': { $in: ['pending', 'processing'] }
          }
        ]
      }),
      // 6. Free quotes waiting for engineer assignment (no owner yet)
      FreeQuote.countDocuments({ status: 'pending' }),
      // NOTE: pre-assessment payment verifications are NOT counted here —
      // they already count in the Site Assessments badge. Counting them in
      // both badges double-counted the same work.
      // 8. Billing: draft invoices waiting to be sent to customer
      SolarInvoice.countDocuments({ status: 'draft' }),
      // 9. Billing: invoices with payment to verify/reject
      SolarInvoice.countDocuments({ paymentStatus: 'for_verification' }),
      // 10. Billing: bank transfers waiting for approve/reject (all of them —
      // even unlinked ones need admin review: approve if linkable, reject if not).
      BankTransferPayment.countDocuments({ status: 'waiting_verification' }),
      // 11. Projects: quoted waiting for approval (cancelled excluded)
      Project.countDocuments({ status: 'quoted' }),
      // 12. Projects: approved/initial_paid with no engineer yet
      Project.countDocuments({
        status: { $in: ['approved', 'initial_paid'] },
        assignedEngineerId: null
      }),
      // 13. Projects: initial_paid waiting for progress payment recording
      Project.countDocuments({ status: 'initial_paid' })
      // NOTE: no toComplete bucket — Mark as Completed is the engineer's
      // job, not the admin's, so in_progress is excluded from admin counts.
    ]);

    const billingTotal = invoicesToSend + invoicesToVerify + bankWaiting;
    const projectsTotal = projApprove + projAssign + projRecordProgress;

    res.json({
      success: true,
      preAssessments,
      freeQuotesPending,
      total: preAssessments + freeQuotesPending,
      billing: {
        invoicesToSend,
        invoicesToVerify,
        bankTransfers: bankWaiting,
        total: billingTotal
      },
      projects: {
        approve: projApprove,
        assignEngineer: projAssign,
        recordProgress: projRecordProgress,
        total: projectsTotal
      }
    });
  } catch (error) {
    console.error('Get action counts error:', error);
    res.status(500).json({ message: 'Failed to fetch action counts', error: error.message });
  }
};

// @desc    Get system configuration
// @route   GET /api/maintenance/config
// @access  Private (Admin, Engineer)
exports.getSystemConfig = async (req, res) => {
  try {
    let config = await SystemConfig.findOne();

    if (!config) {
      config = new SystemConfig();
      await config.save();
    }

    res.json({
      success: true,
      config
    });

  } catch (error) {
    console.error('Get system config error:', error);
    res.status(500).json({ message: 'Failed to fetch system configuration', error: error.message });
  }
};

// @desc    Update system configuration
// @route   PUT /api/maintenance/config
// @access  Private (Admin)
exports.updateSystemConfig = async (req, res) => {
  try {
    const updates = req.body;
    const { reason } = req.query;
    const adminId = req.user.id;

    let config = await SystemConfig.findOne();

    if (!config) {
      config = new SystemConfig();
    }

    const result = await config.updateConfig(updates, req.user.id, reason || 'Manual update');

    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: 'System Configuration Update',
      description: `Updated ${result.updated} configuration settings`,
      type: 'system_config',
      taskData: { updates, reason },
      results: {
        success: true,
        message: `Updated ${result.updated} settings`,
        affectedRecords: result.updated
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });

    await task.save();

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: `Updated system configuration: ${result.updated} settings changed`
    });

    res.json({
      success: true,
      message: 'System configuration updated successfully',
      updated: result.updated,
      history: result.history
    });

  } catch (error) {
    console.error('Update system config error:', error);
    res.status(500).json({ message: 'Failed to update system configuration', error: error.message });
  }
};

// @desc    Reset system configuration to defaults
// @route   POST /api/maintenance/config/reset
// @access  Private (Admin)
exports.resetSystemConfig = async (req, res) => {
  try {
    const adminId = req.user.id;

    // Create new default config
    const newConfig = new SystemConfig();

    let config = await SystemConfig.findOne();

    if (config) {
      const oldConfig = config.toObject();
      await config.updateConfig(newConfig.toObject(), req.user.id, 'Reset to defaults');
    } else {
      config = newConfig;
      await config.save();
    }

    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: 'System Configuration Reset',
      description: 'Reset system configuration to default values',
      type: 'system_config',
      results: {
        success: true,
        message: 'Configuration reset to defaults'
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });

    await task.save();

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: "Reset system configuration to defaults"
    });

    res.json({
      success: true,
      message: 'System configuration reset to defaults',
      config
    });

  } catch (error) {
    console.error('Reset system config error:', error);
    res.status(500).json({ message: 'Failed to reset configuration', error: error.message });
  }
};

// @desc    Get configuration history
// @route   GET /api/maintenance/config/history
// @access  Private (Admin)
exports.getConfigHistory = async (req, res) => {
  try {
    const config = await SystemConfig.findOne()
      .populate('updateHistory.updatedBy', 'firstName lastName email');

    if (!config) {
      return res.json({ success: true, history: [] });
    }

    res.json({
      success: true,
      history: config.updateHistory
    });

  } catch (error) {
    console.error('Get config history error:', error);
    res.status(500).json({ message: 'Failed to fetch history', error: error.message });
  }
};

// ============ EQUIPMENT MANAGEMENT FUNCTIONS ============

// @desc    Add new equipment item
// @route   POST /api/maintenance/config/equipment
// @access  Private (Admin)
exports.addEquipmentItem = async (req, res) => {
  try {
    // FIX: Destructure dob from req.body
    const { type, name, price, brand, capacity, panelArea, warranty, unit, notes, dob } = req.body;
    const { reason } = req.query;
    const adminId = req.user.id;

    // Validate equipment type
    const validTypes = [
      'solarPanels', 'inverters', 'batteries', 'mountingStructures',
      'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
      'junctionBoxes', 'disconnectSwitches', 'meters'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid equipment type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Equipment name is required'
      });
    }

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    // Validate brand (required)
    if (!brand || !brand.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Brand is required'
      });
    }

    // Validate warranty (required)
    if (warranty === undefined || warranty === null || warranty === '') {
      return res.status(400).json({
        success: false,
        message: 'Warranty is required'
      });
    }

    // Validate capacity
    if (!capacity || capacity.value === undefined || capacity.value === '' || capacity.value === null) {
      return res.status(400).json({
        success: false,
        message: 'Capacity is required'
      });
    }

    // Validate unit
    if (!unit || !unit.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Unit is required'
      });
    }

    // Type-specific validations
    if (type === 'solarPanels') {
      if (panelArea === undefined || panelArea === '' || panelArea === null) {
        return res.status(400).json({
          success: false,
          message: 'Panel area is required for solar panels'
        });
      }
      if (parseFloat(panelArea) < 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Panel area must be at least 0.01 m²'
        });
      }
    }

    if (type === 'batteries') {
      if (dob === undefined || dob === '' || dob === null) {
        return res.status(400).json({
          success: false,
          message: 'Depth of Discharge (DoD) is required for batteries'
        });
      }
      const dobNum = parseFloat(dob);
      if (dobNum < 0 || dobNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Depth of Discharge must be between 0 and 100'
        });
      }
    }

    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }

    // Prepare equipment data
    const equipmentData = {
      name: name.trim(),
      price: parseFloat(price),
      brand: brand.trim(),
      warranty: parseFloat(warranty) || 0,
      capacity: {
        value: parseFloat(capacity.value) || 0,
        unit: capacity.unit || ''
      },
      panelArea: type === 'solarPanels' ? parseFloat(panelArea) || 0 : 0,
      dob: type === 'batteries' ? parseFloat(dob) || 0 : 0,
      unit: unit || 'piece',
      notes: notes || ''
    };

    const newItem = await config.addEquipmentItem(
      type,
      equipmentData,
      req.user.id,
      reason || `Added new ${type.slice(0, -1)}: ${name}`
    );

    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: `Added New ${type.slice(0, -1)}`,
      description: `Added ${name} to ${type} catalog`,
      type: 'system_config',
      taskData: { type, item: newItem, reason },
      results: {
        success: true,
        message: `Added ${name} successfully`
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });

    await task.save();

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: `Added ${type.slice(0, -1)}: ${name}`
    });

    res.json({
      success: true,
      message: `${name} added successfully to ${type}`,
      item: newItem
    });

  } catch (error) {
    console.error('Add equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add equipment',
      error: error.message
    });
  }
};

// @desc    Update equipment item
// @route   PUT /api/maintenance/config/equipment/:type/:itemId
// @access  Private (Admin)
exports.updateEquipmentItem = async (req, res) => {
  try {
    // FIX: Destructure dob from req.body
    const { type, itemId } = req.params;
    const { name, price, brand, capacity, panelArea, warranty, unit, notes, dob } = req.body;
    const { reason } = req.query;
    const adminId = req.user.id;

    // Validate equipment type
    const validTypes = [
      'solarPanels', 'inverters', 'batteries', 'mountingStructures',
      'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
      'junctionBoxes', 'disconnectSwitches', 'meters'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `Invalid equipment type. Must be one of: ${validTypes.join(', ')}`
      });
    }

    // Validate required fields
    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Equipment name is required'
      });
    }

    if (!price || price <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid price is required'
      });
    }

    // Validate brand (required)
    if (!brand || !brand.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Brand is required'
      });
    }

    // Validate warranty (required)
    if (warranty === undefined || warranty === null || warranty === '') {
      return res.status(400).json({
        success: false,
        message: 'Warranty is required'
      });
    }

    // Validate capacity
    if (!capacity || capacity.value === undefined || capacity.value === '' || capacity.value === null) {
      return res.status(400).json({
        success: false,
        message: 'Capacity is required'
      });
    }

    // Validate unit
    if (!unit || !unit.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Unit is required'
      });
    }

    // Type-specific validations
    if (type === 'solarPanels') {
      if (panelArea === undefined || panelArea === '' || panelArea === null) {
        return res.status(400).json({
          success: false,
          message: 'Panel area is required for solar panels'
        });
      }
      if (parseFloat(panelArea) < 0.01) {
        return res.status(400).json({
          success: false,
          message: 'Panel area must be at least 0.01 m²'
        });
      }
    }

    if (type === 'batteries') {
      if (dob === undefined || dob === '' || dob === null) {
        return res.status(400).json({
          success: false,
          message: 'Depth of Discharge (DoD) is required for batteries'
        });
      }
      const dobNum = parseFloat(dob);
      if (dobNum < 0 || dobNum > 100) {
        return res.status(400).json({
          success: false,
          message: 'Depth of Discharge must be between 0 and 100'
        });
      }
    }

    let config = await SystemConfig.findOne();
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'System configuration not found'
      });
    }

    // Prepare equipment data
    const equipmentData = {
      name: name.trim(),
      price: parseFloat(price),
      brand: brand.trim(),
      warranty: parseFloat(warranty) || 0,
      capacity: {
        value: parseFloat(capacity.value) || 0,
        unit: capacity.unit || ''
      },
      panelArea: type === 'solarPanels' ? parseFloat(panelArea) || 0 : 0,
      dob: type === 'batteries' ? parseFloat(dob) || 0 : 0,
      unit: unit || 'piece',
      notes: notes || ''
    };

    const updatedItem = await config.updateEquipmentItem(
      type,
      itemId,
      equipmentData,
      req.user.id,
      reason || `Updated ${type.slice(0, -1)}: ${name}`
    );

    if (!updatedItem) {
      return res.status(404).json({
        success: false,
        message: 'Equipment item not found'
      });
    }

    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: `Updated ${type.slice(0, -1)}`,
      description: `Updated ${name} in ${type} catalog`,
      type: 'system_config',
      taskData: { type, item: updatedItem, reason },
      results: {
        success: true,
        message: `Updated ${name} successfully`
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });

    await task.save();

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: `Updated ${type.slice(0, -1)}: ${name}`
    });

    res.json({
      success: true,
      message: `${name} updated successfully in ${type}`,
      item: updatedItem
    });

  } catch (error) {
    console.error('Update equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update equipment',
      error: error.message
    });
  }
};

// @desc    Remove equipment item (soft delete)
// @route   DELETE /api/maintenance/config/equipment/:type/:itemId
// @access  Private (Admin)
exports.removeEquipmentItem = async (req, res) => {
  try {
    const { type, itemId } = req.params;
    const { reason } = req.body;
    const { hardDelete } = req.query;
    const adminId = req.user.id;

    const validTypes = [
      'solarPanels', 'inverters', 'batteries', 'mountingStructures',
      'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
      'junctionBoxes', 'disconnectSwitches', 'meters'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment type'
      });
    }

    let config = await SystemConfig.findOne();
    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'Configuration not found'
      });
    }

    let removedItem;
    if (hardDelete === 'true') {
      removedItem = await config.hardDeleteEquipmentItem(
        type,
        itemId,
        req.user.id,
        reason || `Hard deleted ${type.slice(0, -1)}`
      );
    } else {
      removedItem = await config.removeEquipmentItem(
        type,
        itemId,
        req.user.id,
        reason || `Removed ${type.slice(0, -1)}`
      );
    }

    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: `Removed ${type.slice(0, -1)}`,
      description: `${hardDelete === 'true' ? 'Permanently deleted' : 'Removed'} ${removedItem.name} from ${type} catalog`,
      type: 'system_config',
      taskData: { type, itemId, hardDelete: hardDelete === 'true', reason },
      results: {
        success: true,
        message: `Removed ${removedItem.name} successfully`
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });

    await task.save();

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: `${hardDelete === 'true' ? 'Permanently deleted' : 'Removed'} ${type.slice(0, -1)}: ${removedItem.name}`
    });

    res.json({
      success: true,
      message: `Equipment ${hardDelete === 'true' ? 'permanently deleted' : 'removed'} successfully`,
      item: removedItem
    });

  } catch (error) {
    console.error('Remove equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove equipment',
      error: error.message
    });
  }
};

// @desc    Get equipment by type
// @route   GET /api/maintenance/config/equipment/:type
// @access  Private (Admin, Engineer)
exports.getEquipmentByType = async (req, res) => {
  try {
    const { type } = req.params;
    const { includeInactive } = req.query;

    const validTypes = [
      'solarPanels', 'inverters', 'batteries', 'mountingStructures',
      'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
      'junctionBoxes', 'disconnectSwitches', 'meters'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment type'
      });
    }

    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }

    let items = config.equipmentPrices[type] || [];

    // Filter by active status if needed
    if (includeInactive !== 'true') {
      items = items.filter(item => item.isActive !== false);
    }

    res.json({
      success: true,
      type,
      count: items.length,
      items
    });

  } catch (error) {
    console.error('Get equipment by type error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch equipment',
      error: error.message
    });
  }
};

// @desc    Bulk update equipment (import/update multiple items)
// @route   POST /api/maintenance/config/equipment/bulk
// @access  Private (Admin)
exports.bulkUpdateEquipment = async (req, res) => {
  try {
    const { type, items, action } = req.body;
    const { reason } = req.query;
    const adminId = req.user.id;

    const validTypes = [
      'solarPanels', 'inverters', 'batteries', 'mountingStructures',
      'electricalComponents', 'cablesAndWiring', 'safetyEquipment',
      'junctionBoxes', 'disconnectSwitches', 'meters'
    ];

    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid equipment type'
      });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array is required'
      });
    }

    let config = await SystemConfig.findOne();
    if (!config) {
      config = new SystemConfig();
      await config.save();
    }

    let results = [];

    switch (action) {
      case 'replace':
        // Replace entire array
        config.equipmentPrices[type] = items.map(item => ({
          ...item,
          createdAt: new Date(),
          updatedAt: new Date(),
          isActive: item.isActive !== false
        }));
        results = config.equipmentPrices[type];
        break;

      case 'add':
        // Add multiple items
        for (const item of items) {
          const newItem = await config.addEquipmentItem(
            type,
            item,
            req.user.id,
            reason || `Bulk add: ${item.name}`
          );
          results.push(newItem);
        }
        break;

      default:
        return res.status(400).json({
          success: false,
          message: 'Invalid action. Use: add, update, or replace'
        });
    }

    await config.save();

    // Create maintenance task record
    const task = new MaintenanceTask({
      taskId: generateTaskId(),
      title: `Bulk ${action} ${type.slice(0, -1)}s`,
      description: `${action === 'replace' ? 'Replaced entire' : `Added ${results.length}`} ${type} catalog`,
      type: 'system_config',
      taskData: { type, action, count: results.length, reason },
      results: {
        success: true,
        message: `Successfully ${action}ed ${results.length} items`,
        affectedRecords: results.length
      },
      completedAt: new Date(),
      status: 'completed',
      createdBy: req.user.id
    });

    await task.save();

    // Save audit trail
    await AuditLog.create({
      user: adminId,
      role: req.user.role,
      module: "Maintenance",
      action: `Bulk ${action} ${results.length} ${type.slice(0, -1)}s`
    });

    res.json({
      success: true,
      message: `Successfully ${action}ed ${results.length} items`,
      action,
      count: results.length,
      items: results
    });

  } catch (error) {
    console.error('Bulk update equipment error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to bulk update equipment',
      error: error.message
    });
  }
};