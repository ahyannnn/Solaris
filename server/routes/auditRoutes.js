// routes/auditRoutes.js

const express = require("express");
const router = express.Router();

const AuditLog = require("../models/AuditLog");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/roleMiddleware");

// GET /api/audit
// Admin only - with pagination to prevent fetching all records at once
router.get("/", protect, admin, async (req, res) => {
    try {
        // Get pagination parameters from query string
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination info
        const total = await AuditLog.countDocuments();

        // Fetch only the requested page of logs
        const logs = await AuditLog.find()
            .populate('user', 'fullName email firstName lastName')
            .sort({ createdAt: -1 })
            .skip(skip)    // Skip previous pages
            .limit(limit); // Limit to page size

        res.status(200).json({
            success: true,
            total: total,
            page: page,
            limit: limit,
            totalPages: Math.ceil(total / limit),
            data: logs
        });

    } catch (error) {
        console.error("Audit Log Error:", error);

        res.status(500).json({
            success: false,
            message: "Failed to retrieve audit logs."
        });
    }
});

module.exports = router;