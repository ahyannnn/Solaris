// routes/auditRoutes.js

const express = require("express");
const router = express.Router();

const AuditLog = require("../models/AuditLog");
const { protect } = require("../middleware/authMiddleware");
const { admin } = require("../middleware/roleMiddleware");

// GET /api/audit
// Admin only
router.get("/", protect, admin, async (req, res) => {
    try {
        const logs = await AuditLog.find()
            .populate('user', 'fullName email firstName lastName') // Populate user fields
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: logs.length,
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