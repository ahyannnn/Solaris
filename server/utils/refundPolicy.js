// utils/refundPolicy.js - Cancellation & Refund per termspage.jsx §4
// Anchor is PreAssessment.siteVisitDate (Q3). If null, treat as ≥72h => 80%.
function calculateRefund({ assessmentFee = 1500, siteVisitDate, assessmentStatus, paymentStatus }) {
  const FEE = Number(assessmentFee) || 1500;
  const now = new Date();

  // During monitoring: no refund if early removal/denied access/tampering per Term 4B
  const monitoringStatuses = ['site_visit_ongoing', 'device_deployed', 'data_collecting', 'data_analyzing'];
  const isMonitoringBeforeDeployment = monitoringStatuses.includes(assessmentStatus);
  // Only block refund if already paid & in monitoring. Pending unpaid monitoring still no fee to refund but block percentage.
  if (isMonitoringBeforeDeployment) {
    return {
      hoursBeforeDeployment: null,
      policyTier: 'during_monitoring',
      refundPercentage: 0,
      refundAmount: 0,
      deploymentDate: siteVisitDate || null,
      reason: 'No refund during monitoring period per Terms §4.B'
    };
  }

  if (!siteVisitDate) {
    // No schedule yet -> most generous tier per plan
    return {
      hoursBeforeDeployment: null,
      policyTier: 'no_schedule',
      refundPercentage: 80,
      refundAmount: Math.floor(FEE * 0.8),
      deploymentDate: null,
      reason: 'No deployment date set — 80% tier applied'
    };
  }

  const deploymentDate = new Date(siteVisitDate);
  const diffMs = deploymentDate.getTime() - now.getTime();
  const hoursBeforeDeployment = diffMs / 3600000;

  // Already past deployment => no refund
  if (hoursBeforeDeployment < 0) {
    return {
      hoursBeforeDeployment,
      policyTier: '<48h',
      refundPercentage: 0,
      refundAmount: 0,
      deploymentDate,
      reason: 'Deployment time has passed — no refund'
    };
  }

  if (hoursBeforeDeployment >= 72) {
    return {
      hoursBeforeDeployment,
      policyTier: '≥72h',
      refundPercentage: 80,
      refundAmount: Math.floor(FEE * 0.8),
      deploymentDate,
      reason: '72 or more hours before deployment — 80% refund'
    };
  }
  if (hoursBeforeDeployment >= 48) {
    return {
      hoursBeforeDeployment,
      policyTier: '48-72h',
      refundPercentage: 50,
      refundAmount: Math.floor(FEE * 0.5),
      deploymentDate,
      reason: '48 to 72 hours before deployment — 50% refund'
    };
  }
  return {
    hoursBeforeDeployment,
    policyTier: '<48h',
    refundPercentage: 0,
    refundAmount: 0,
    deploymentDate,
    reason: 'Less than 48 hours before deployment — no refund'
  };
}

module.exports = { calculateRefund };
