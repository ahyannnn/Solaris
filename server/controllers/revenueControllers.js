// controllers/revenueControllers.js
const PreAssessment = require('../models/PreAssessment');

// @desc    Get revenue data for dashboard
// @route   GET /api/admin/revenue
// @access  Private (Admin)
exports.getRevenueStats = async (req, res) => {
  try {
    const currentDate = new Date();
    const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const firstDayOfYear = new Date(currentDate.getFullYear(), 0, 1);

    // Get paid assessments
    const paidAssessments = await PreAssessment.find({
      paymentStatus: 'paid'
    });

    const paidThisMonth = await PreAssessment.find({
      paymentStatus: 'paid',
      confirmedAt: { $gte: firstDayOfMonth }
    });

    const paidThisYear = await PreAssessment.find({
      paymentStatus: 'paid',
      confirmedAt: { $gte: firstDayOfYear }
    });

    // Calculate revenue
    const totalRevenue = paidAssessments.reduce((sum, a) => sum + (a.assessmentFee || 0), 0);
    const monthlyRevenue = paidThisMonth.reduce((sum, a) => sum + (a.assessmentFee || 0), 0);
    const yearlyRevenue = paidThisYear.reduce((sum, a) => sum + (a.assessmentFee || 0), 0);

    // Get pending payments
    const pendingPayments = await PreAssessment.find({
      paymentStatus: { $in: ['pending', 'for_verification'] }
    });

    const pendingAmount = pendingPayments.reduce((sum, a) => sum + (a.assessmentFee || 0), 0);

    // Get monthly revenue breakdown
    const monthlyBreakdown = await getMonthlyRevenueBreakdown();

    res.json({
      success: true,
      total: totalRevenue,
      thisMonth: monthlyRevenue,
      thisYear: yearlyRevenue,
      pending: pendingAmount,
      monthlyBreakdown
    });

  } catch (error) {
    console.error('Get revenue stats error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue stats', error: error.message });
  }
};

// @desc    Get monthly revenue breakdown
// @route   GET /api/admin/revenue/monthly
// @access  Private (Admin)
exports.getMonthlyRevenue = async (req, res) => {
  try {
    const breakdown = await getMonthlyRevenueBreakdown();
    res.json({
      success: true,
      monthlyBreakdown: breakdown
    });

  } catch (error) {
    console.error('Get monthly revenue error:', error);
    res.status(500).json({ message: 'Failed to fetch monthly revenue', error: error.message });
  }
};

// Helper function to get monthly revenue breakdown
const getMonthlyRevenueBreakdown = async () => {
  const currentYear = new Date().getFullYear();
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const monthlyData = [];

  for (let i = 0; i < 12; i++) {
    const startDate = new Date(currentYear, i, 1);
    const endDate = new Date(currentYear, i + 1, 0);

    const assessments = await PreAssessment.find({
      paymentStatus: 'paid',
      confirmedAt: { $gte: startDate, $lte: endDate }
    });

    const revenue = assessments.reduce((sum, a) => sum + (a.assessmentFee || 0), 0);
    const count = assessments.length;

    monthlyData.push({
      month: months[i],
      revenue,
      count
    });
  }

  return monthlyData;
};

// @desc    Get revenue by date range
// @route   POST /api/admin/revenue/range
// @access  Private (Admin)
exports.getRevenueByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const assessments = await PreAssessment.find({
      paymentStatus: 'paid',
      confirmedAt: { $gte: start, $lte: end }
    });

    const totalRevenue = assessments.reduce((sum, a) => sum + (a.assessmentFee || 0), 0);
    const count = assessments.length;

    res.json({
      success: true,
      revenue: {
        total: totalRevenue,
        count,
        startDate: start,
        endDate: end
      }
    });

  } catch (error) {
    console.error('Get revenue by date range error:', error);
    res.status(500).json({ message: 'Failed to fetch revenue data', error: error.message });
  }
};