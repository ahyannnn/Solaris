const SensorData = require("../models/SensorData");
const PreAssessment = require("../models/PreAssessment");
const IoTDevice = require("../models/IoTDevice");

// Statuses that are allowed to auto-transition to device_deployed
// when the first IoT reading arrives (ESP32 AP portal Save -> reboot -> POST).
const AUTO_DEPLOY_FROM_STATUSES = ['scheduled', 'site_visit_ongoing'];

function isPlaceholderBookingRef(bookingReference) {
  if (!bookingReference) return true;
  const v = String(bookingReference).trim();
  return v === '' || v.toUpperCase() === 'N/A';
}

async function tryAutoDeployFromSensor({ bookingReference, deviceId }) {
  // Returns { autoDeployed: boolean, reason: string }
  if (isPlaceholderBookingRef(bookingReference)) {
    return { autoDeployed: false, reason: 'placeholder-bookingReference' };
  }
  const bookingRef = String(bookingReference).trim();

  const assessment = await PreAssessment.findOne({ bookingReference: bookingRef });
  if (!assessment) {
    console.log(`[auto-deploy] no assessment for bookingReference=${bookingRef}`);
    return { autoDeployed: false, reason: 'assessment-not-found' };
  }

  if (!AUTO_DEPLOY_FROM_STATUSES.includes(assessment.assessmentStatus)) {
    return { autoDeployed: false, reason: `status-${assessment.assessmentStatus}-not-eligible` };
  }

  const now = new Date();
  let device = null;
  if (deviceId) {
    device = await IoTDevice.findOne({ deviceId: String(deviceId).trim() });
  }

  // Link device to assessment if assessment has none yet but device exists.
  if (device && !assessment.iotDeviceId) {
    assessment.iotDeviceId = device._id;
  }

  // Sync physical device record (best-effort, never blocks ingest).
  if (device && ['available', 'assigned'].includes(device.status)) {
    device.status = 'deployed';
    device.deployedAt = device.deployedAt || now;
    // No auth context on sensor POST, attribute to assigned engineer when known.
    if (!device.deployedBy && assessment.assignedEngineerId) {
      device.deployedBy = assessment.assignedEngineerId;
    }
    if (!device.deploymentNotes) {
      device.deploymentNotes = 'Auto-deployed via IoT first data (ESP32 AP portal)';
    }
    try {
      const history = device.deploymentHistory || [];
      const last = history[history.length - 1];
      if (last && !last.deployedAt) {
        last.deployedAt = now;
        if (!last.deployedBy && assessment.assignedEngineerId) {
          last.deployedBy = assessment.assignedEngineerId;
        }
      } else if (!last || String(last.preAssessmentId) !== String(assessment._id)) {
        history.push({
          preAssessmentId: assessment._id,
          assignedAt: device.assignedAt || now,
          assignedBy: device.assignedBy,
          deployedAt: now,
          deployedBy: device.deployedBy || assessment.assignedEngineerId,
          notes: 'Auto-deployed via IoT first data'
        });
        device.deploymentHistory = history;
      }
      await device.save();
    } catch (e) {
      console.error('[auto-deploy] device sync failed:', e.message);
    }
  }

  assessment.assessmentStatus = 'device_deployed';
  assessment.deviceDeployedAt = assessment.deviceDeployedAt || now;
  assessment.dataCollectionStart = assessment.dataCollectionStart || now;
  if (!assessment.deviceDeployedBy && assessment.assignedEngineerId) {
    assessment.deviceDeployedBy = assessment.assignedEngineerId;
  }
  // Mark source of deployment for UI (manual Deploy button stays as fallback).
  try {
    if (!assessment.deviceDeployment) assessment.deviceDeployment = {};
    if (!assessment.deviceDeployment.calibrationNotes) {
      assessment.deviceDeployment.calibrationNotes = 'Auto-deployed via IoT first data (ESP32 AP portal)';
    }
  } catch (e) { /* ignore - schema tolerant */ }

  await assessment.save(); // triggers realtime pre-assessments:updated via hooks
  console.log(`✅ [auto-deploy] ${bookingRef} -> device_deployed (deviceId=${deviceId})`);
  return { autoDeployed: true, reason: 'deployed' };
}

exports.receiveData = async (req, res) => {
  try {
    const { deviceId, bookingReference, irradiance, temperature, humidity, gps, timestamp } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: "Device ID is required" });
    }
    if (!bookingReference) {
      return res.status(400).json({ message: "Booking reference is required" });
    }
    const data = new SensorData({
      deviceId,
      bookingReference,
      irradiance,
      temperature,
      humidity,
      gps,          // optional, send only once per device
      timestamp: timestamp ? new Date(timestamp) : undefined
    });

    await data.save();

    // Auto-deploy: ESP32 AP portal Save -> reboot -> first POST here.
    // Best-effort only — ingest must never fail because of deploy logic.
    // Manual POST /api/pre-assessments/:id/deploy-device stays as fallback.
    let autoDeploy = { autoDeployed: false, reason: 'skipped' };
    try {
      autoDeploy = await tryAutoDeployFromSensor({ bookingReference, deviceId });
    } catch (e) {
      console.error('[auto-deploy] failed:', e.message);
    }

    res.status(200).json({
      message: autoDeploy.autoDeployed
        ? 'Data saved successfully. Device auto-marked as deployed.'
        : 'Data saved successfully',
      autoDeployed: autoDeploy.autoDeployed,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports.tryAutoDeployFromSensor = tryAutoDeployFromSensor;
module.exports.AUTO_DEPLOY_FROM_STATUSES = AUTO_DEPLOY_FROM_STATUSES;
